package com.vsa.service;

import com.vsa.controller.ApplicationDtos;
import com.vsa.dto.request.AccountResendRequest;
import com.vsa.dto.request.AccountVerificationRequest;
import com.vsa.dto.response.AccountVerificationStartResponse;
import com.vsa.model.User;
import com.vsa.repository.UserRepository;
import com.vsa.security.JwtUtil;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service class for managing User authentication and account operations.
 *
 * <p>Handles user registration, email verification, login, and password management. Includes
 * integration with email service for sending verification and reset emails.
 *
 * <p>Email verification is code-based rather than link-based: the user is emailed a short code and
 * types it back into the page they started on, so opening the email on a phone doesn't strand the
 * signup on a different device. The mechanics mirror {@code RegistrationService}'s event-signup
 * verification — hashed single-use code, expiry, resend cooldown, and a cap on wrong guesses.
 *
 * @author VSA Development Team
 */
@Service
public class UserService {
  // ── Verification Tuning ───────────────────────────────────
  private static final int VERIFICATION_CODE_LENGTH = 8;
  private static final int VERIFICATION_EXPIRATION_MINUTES = 15;
  private static final int VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
  private static final int MAX_VERIFICATION_ATTEMPTS = 5;

  /** Excludes I, O, 0 and 1 so a code is unambiguous when read off a screen. */
  private static final String VERIFICATION_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  private static final String VERIFICATION_CODE_PATTERN =
          "^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{" + VERIFICATION_CODE_LENGTH + "}$";

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  // ── Dependencies ──────────────────────────────────────────
  private final UserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final EmailService emailService;
  private final EmailOutboxService emailOutboxService;

  /**
   * Constructs a UserService with required dependencies.
   *
   * @param userRepository Repository for user data access
   * @param passwordEncoder Encoder for password hashing
   * @param jwtUtil Utility for JWT token generation and validation
   * @param emailService Service for sending emails
   * @param emailOutboxService Service for queuing emails for asynchronous delivery
   */
  public UserService(
          UserRepository userRepository,
          BCryptPasswordEncoder passwordEncoder,
          JwtUtil jwtUtil,
          EmailService emailService,
          EmailOutboxService emailOutboxService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
    this.emailService = emailService;
    this.emailOutboxService = emailOutboxService;
  }

  // ── Profile ──────────────────────────────────────────────────

  /**
   * Retrieves the profile of an authenticated user.
   *
   * @param email The authenticated user's email
   * @return The user's profile
   * @throws IllegalArgumentException If no user with the given email exists
   */
  public ApplicationDtos.UserProfileResponse getProfile(String email) {
    User user =
            userRepository
                    .findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
    return new ApplicationDtos.UserProfileResponse(
            user.getUid(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole());
  }

  // ── Registration & Verification ────────────────────────────

  @Transactional
  public AccountVerificationStartResponse registerUser(User user) {
    if (user.getUid() != null) {
      throw new IllegalArgumentException("uid must not be provided");
    }
    if (user.getEmail() == null || user.getEmail().isBlank()) {
      throw new IllegalArgumentException("Email is required");
    }
    if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
      throw new IllegalArgumentException("Password is required");
    }

    String email = user.getEmail().trim();

    Optional<User> existing = userRepository.findByEmailIgnoreCase(email);

    if (existing.isPresent() && existing.get().isEmailVerified()) {
      throw new IllegalArgumentException("Email already exists");
    }

    // Reuse the pending row if there is one, otherwise start a fresh account.
    User account = existing.orElseGet(User::new);

    account.setEmail(email);
    account.setFirstName(user.getFirstName());
    account.setLastName(user.getLastName());
    account.setPhone(user.getPhone());
    account.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
    account.setRole("student");
    account.setEmailVerified(false);

    String verificationCode = issueVerificationCode(account);

    User saved = userRepository.save(account);

    emailOutboxService.queueAccountVerificationEmail(
            saved.getUid(), saved.getEmail(), saved.getFirstName(), verificationCode);

    return new AccountVerificationStartResponse(
            saved.getVerificationId(), maskEmail(saved.getEmail()), saved.getVerificationExpiresAt());
  }

  @Transactional(dontRollbackOn = IncorrectVerificationCodeException.class)
  public String verifyEmail(AccountVerificationRequest req) {
    if (req.getVerificationId() == null) {
      throw new IllegalArgumentException("Verification ID is required.");
    }
    if (req.getCode() == null || req.getCode().isBlank()) {
      throw new IllegalArgumentException("Verification code is required.");
    }

    String enteredCode = req.getCode().trim().toUpperCase(Locale.ROOT);

    if (!enteredCode.matches(VERIFICATION_CODE_PATTERN)) {
      throw new IllegalArgumentException("Invalid verification code.");
    }

    User user =
            userRepository
                    .findByVerificationId(req.getVerificationId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Verification request was not found."));

    if (user.isEmailVerified()) {
      throw new IllegalArgumentException("This account is already verified. Please sign in.");
    }

    if (user.getVerificationExpiresAt() == null
            || user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException(
              "Verification code has expired. Please request a new one.");
    }

    if (user.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
      throw new IllegalArgumentException(
              "Too many incorrect attempts. Please request a new code.");
    }

    if (!passwordEncoder.matches(enteredCode, user.getVerificationCodeHash())) {
      user.setVerificationAttempts(user.getVerificationAttempts() + 1);
      userRepository.save(user);
      throw new IncorrectVerificationCodeException();
    }

    // Verified. The code is single-use, so clear the whole session.
    user.setEmailVerified(true);
    user.setVerificationId(null);
    user.setVerificationCodeHash(null);
    user.setVerificationCodeSentAt(null);
    user.setVerificationExpiresAt(null);
    user.setVerificationAttempts(0);

    User saved = userRepository.save(user);

    return jwtUtil.generateToken(saved.getEmail(), saved.getRole());
  }

  @Transactional
  public AccountVerificationStartResponse resendVerificationCode(AccountResendRequest req) {
    if (req.getEmail() == null || req.getEmail().isBlank()) {
      throw new IllegalArgumentException("Email is required.");
    }

    User user =
            userRepository
                    .findByEmailIgnoreCase(req.getEmail().trim())
                    .orElseThrow(
                            () -> new IllegalArgumentException("No pending account found for this email."));

    if (user.isEmailVerified()) {
      throw new IllegalArgumentException("This account is already verified. Please sign in.");
    }

    LocalDateTime now = LocalDateTime.now();

    if (user.getVerificationCodeSentAt() != null
            && now.isBefore(
            user.getVerificationCodeSentAt().plusSeconds(VERIFICATION_RESEND_COOLDOWN_SECONDS))) {
      throw new IllegalArgumentException("Please wait before requesting another code.");
    }

    String verificationCode = issueVerificationCode(user);

    User saved = userRepository.save(user);

    emailOutboxService.queueAccountVerificationEmail(
            saved.getUid(), saved.getEmail(), saved.getFirstName(), verificationCode);

    return new AccountVerificationStartResponse(
            saved.getVerificationId(), maskEmail(saved.getEmail()), saved.getVerificationExpiresAt());
  }

  // ── Authentication ──────────────────────────────────────────

  /**
   * Authenticates a user with email and password.
   *
   * <p>Verifies that the email exists, email is verified, and password matches. On success,
   * generates and returns a JWT token.
   *
   * @param email The user's email
   * @param rawPassword The user's password in plain text
   * @return JWT token for authenticated requests
   * @throws IllegalArgumentException If email/password invalid or email not verified
   */
  public String login(String email, String rawPassword) {
    User user =
            userRepository
                    .findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

    if (!user.isEmailVerified()) {
      throw new IllegalArgumentException("Please verify your email first");
    }

    if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid email or password");
    }

    return jwtUtil.generateToken(user.getEmail(), user.getRole());
  }

  // ── Password Management ────────────────────────────────────

  /**
   * Initiates a password reset process.
   *
   * <p>Generates a reset token with 30-minute expiry and sends it via email to the user.
   *
   * @param email The user's email
   * @throws IllegalArgumentException If the email is not found
   */
  public void forgotPassword(String email) {
    User user =
            userRepository
                    .findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Email not found"));

    user.setResetToken(UUID.randomUUID().toString());
    user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
    userRepository.save(user);

    emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), user.getResetToken());
  }

  /**
   * Resets a user's password using a valid reset token.
   *
   * <p>Validates that the token exists and has not expired before updating the password. Clears the
   * reset token after successful password reset.
   *
   * @param token The password reset token
   * @param newPassword The new password in plain text (will be hashed)
   * @throws IllegalArgumentException If token is invalid or has expired
   */
  public void resetPassword(String token, String newPassword) {
    User user =
            userRepository
                    .findByResetToken(token)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

    if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("Reset token has expired");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setResetToken(null);
    user.setResetTokenExpiry(null);
    userRepository.save(user);
  }

  // ── Helpers ────────────────────────────────────────────────

  private String issueVerificationCode(User user) {
    String verificationCode = generateVerificationCode();
    LocalDateTime now = LocalDateTime.now();

    // Legacy rows (and brand-new accounts) have no session handle yet.
    if (user.getVerificationId() == null) {
      user.setVerificationId(UUID.randomUUID());
    }

    user.setVerificationCodeHash(passwordEncoder.encode(verificationCode));
    user.setVerificationCodeSentAt(now);
    user.setVerificationExpiresAt(now.plusMinutes(VERIFICATION_EXPIRATION_MINUTES));
    user.setVerificationAttempts(0);

    return verificationCode;
  }

  private String generateVerificationCode() {
    StringBuilder code = new StringBuilder(VERIFICATION_CODE_LENGTH);

    for (int i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
      int index = SECURE_RANDOM.nextInt(VERIFICATION_CHARACTERS.length());
      code.append(VERIFICATION_CHARACTERS.charAt(index));
    }
    return code.toString();
  }

  private String maskEmail(String email) {
    int atIndex = email.indexOf("@");

    if (atIndex <= 0) {
      return email;
    }

    String localPart = email.substring(0, atIndex);
    String domain = email.substring(atIndex);

    if (localPart.length() == 1) {
      return localPart.charAt(0) + "***" + domain;
    }

    return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + domain;
  }

  private static class IncorrectVerificationCodeException extends IllegalArgumentException {

    private IncorrectVerificationCodeException() {
      super("Incorrect verification code.");
    }
  }
}