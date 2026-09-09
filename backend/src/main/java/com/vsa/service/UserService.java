package com.vsa.service;

import com.vsa.controller.ApplicationDtos;
import com.vsa.dto.request.AccountResendRequest;
import com.vsa.dto.request.AccountVerificationRequest;
import com.vsa.dto.request.ChangeEmailRequest;
import com.vsa.dto.request.ChangePasswordRequest;
import com.vsa.dto.request.UpdateProfileRequest;
import com.vsa.dto.request.VerifyEmailChangeRequest;
import com.vsa.dto.response.AccountVerificationStartResponse;
import com.vsa.dto.response.EmailChangeStartResponse;
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
import org.springframework.web.multipart.MultipartFile;

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
  private final FileStorageService fileStorageService;

  /**
   * Constructs a UserService with required dependencies.
   *
   * @param userRepository Repository for user data access
   * @param passwordEncoder Encoder for password hashing
   * @param jwtUtil Utility for JWT token generation and validation
   * @param emailService Service for sending emails
   * @param emailOutboxService Service for queuing emails for asynchronous delivery
   * @param fileStorageService Service for storing avatar images
   */
  public UserService(
          UserRepository userRepository,
          BCryptPasswordEncoder passwordEncoder,
          JwtUtil jwtUtil,
          EmailService emailService,
          EmailOutboxService emailOutboxService,
          FileStorageService fileStorageService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
    this.emailService = emailService;
    this.emailOutboxService = emailOutboxService;
    this.fileStorageService = fileStorageService;
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
            user.getRole(),
            user.getProfileImageUrl());
  }

  // ── Registration & Verification ────────────────────────────

  /**
   * Registers a new user account and emails a verification code.
   *
   * <p>If the email already belongs to an account that was created but never verified, that
   * pending row is reused and reissued a fresh code rather than rejected. Without this, a user who
   * closed the tab before verifying could never sign up with that address again: registration
   * would say the email exists, and login would say it needs verifying, with no way out. Reusing
   * the row is safe because an unverified account holds no privileges and only the real inbox
   * owner can complete verification.
   *
   * @param user The user with profile details and a plaintext password in {@code passwordHash}
   * @return The verification session handle, masked email, and code expiry
   * @throws IllegalArgumentException If a uid was supplied, required fields are missing, or the
   *     email already belongs to a verified account
   */
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

  /**
   * Verifies a user's email address using the code they were emailed.
   *
   * <p>On success the account is marked verified, the code is discarded, and a JWT is returned so
   * the frontend can log the user straight in rather than making them retype credentials.
   *
   * @param req The verification session handle and the submitted code
   * @return A JWT for the now-verified user
   * @throws IllegalArgumentException If the request is malformed, the session is unknown, the code
   *     is expired, too many wrong guesses have been made, or the code does not match
   */
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

  /**
   * Issues a fresh verification code for a pending account.
   *
   * <p>Keyed by email rather than by verification id, because the user this exists for is exactly
   * the one who closed the tab and no longer has a verification id to send back.
   *
   * @param req The email address of the pending account
   * @return A new verification session handle, masked email, and code expiry
   * @throws IllegalArgumentException If the email is unknown, already verified, or a code was sent
   *     too recently
   */
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

  // ── Account Management ─────────────────────────────────────

  /**
   * Updates the profile fields that don't require re-authentication.
   *
   * <p>Null fields are left untouched, so a caller sending only {@code phone} doesn't blank out
   * the user's name.
   *
   * @param email The authenticated user's email
   * @param req The fields to change
   * @return The updated profile
   */
  @Transactional
  public ApplicationDtos.UserProfileResponse updateProfile(String email, UpdateProfileRequest req) {
    User user = requireUser(email);

    if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
      user.setFirstName(req.getFirstName().trim());
    }
    if (req.getLastName() != null && !req.getLastName().isBlank()) {
      user.setLastName(req.getLastName().trim());
    }
    // Phone is optional on the account, so an explicit empty string clears it.
    if (req.getPhone() != null) {
      user.setPhone(req.getPhone().isBlank() ? null : req.getPhone().trim());
    }

    userRepository.save(user);
    return getProfile(user.getEmail());
  }

  /**
   * Replaces the user's avatar.
   *
   * <p>The previous image is deleted from storage after the new URL is saved, so an orphaned file
   * isn't left paying for itself in S3 forever.
   *
   * @param email The authenticated user's email
   * @param image The uploaded image
   * @return The updated profile
   * @throws IllegalArgumentException If no file was supplied
   */
  @Transactional
  public ApplicationDtos.UserProfileResponse updateAvatar(String email, MultipartFile image) {
    if (image == null || image.isEmpty()) {
      throw new IllegalArgumentException("An image file is required.");
    }

    User user = requireUser(email);
    String previousImageUrl = user.getProfileImageUrl();

    user.setProfileImageUrl(fileStorageService.save(image));
    userRepository.save(user);

    deleteStoredImageQuietly(previousImageUrl);

    return getProfile(user.getEmail());
  }

  /**
   * Removes the user's avatar, falling back to whatever placeholder the frontend shows.
   *
   * @param email The authenticated user's email
   * @return The updated profile
   */
  @Transactional
  public ApplicationDtos.UserProfileResponse removeAvatar(String email) {
    User user = requireUser(email);
    String previousImageUrl = user.getProfileImageUrl();

    user.setProfileImageUrl(null);
    userRepository.save(user);

    deleteStoredImageQuietly(previousImageUrl);

    return getProfile(user.getEmail());
  }

  /**
   * Changes the user's password after checking the current one.
   *
   * @param email The authenticated user's email
   * @param req The current and new passwords
   * @throws IllegalArgumentException If the current password is wrong or the new one matches it
   */
  @Transactional
  public void changePassword(String email, ChangePasswordRequest req) {
    User user = requireUser(email);

    if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Current password is incorrect.");
    }
    if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("New password must be different from the current one.");
    }

    user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));

    // Any outstanding reset link is now stale.
    user.setResetToken(null);
    user.setResetTokenExpiry(null);

    userRepository.save(user);
  }

  /**
   * Starts an email change by mailing a code to the proposed new address.
   *
   * <p>The account's live email is left alone until the code comes back, so a mistyped address
   * can't strand the user. Requires the current password, because whoever controls the email
   * controls password resets and therefore the account.
   *
   * @param email The authenticated user's current email
   * @param req The current password and the desired new address
   * @return The masked destination and the code's expiry
   * @throws IllegalArgumentException If the password is wrong, the address is unchanged, the
   *     address is already taken, or a code was requested too recently
   */
  @Transactional
  public EmailChangeStartResponse startEmailChange(String email, ChangeEmailRequest req) {
    User user = requireUser(email);

    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Password is incorrect.");
    }

    String newEmail = req.getNewEmail().trim();

    if (newEmail.equalsIgnoreCase(user.getEmail())) {
      throw new IllegalArgumentException("That is already your email address.");
    }
    if (userRepository.findByEmailIgnoreCase(newEmail).isPresent()) {
      throw new IllegalArgumentException("That email is already in use.");
    }

    LocalDateTime now = LocalDateTime.now();

    if (user.getPendingEmailSentAt() != null
            && now.isBefore(
            user.getPendingEmailSentAt().plusSeconds(VERIFICATION_RESEND_COOLDOWN_SECONDS))) {
      throw new IllegalArgumentException("Please wait before requesting another code.");
    }

    String verificationCode = generateVerificationCode();

    user.setPendingEmail(newEmail);
    user.setPendingEmailCodeHash(passwordEncoder.encode(verificationCode));
    user.setPendingEmailSentAt(now);
    user.setPendingEmailExpiresAt(now.plusMinutes(VERIFICATION_EXPIRATION_MINUTES));
    user.setPendingEmailAttempts(0);

    userRepository.save(user);

    // Sent to the NEW address — that is the address being proven.
    emailOutboxService.queueEmailChangeVerificationEmail(
            user.getUid(), newEmail, user.getFirstName(), verificationCode);

    return new EmailChangeStartResponse(
            maskEmail(newEmail), user.getPendingEmailExpiresAt());
  }

  /**
   * Completes an email change.
   *
   * <p>Returns a fresh JWT: the existing token identifies the user by their old email, so it stops
   * resolving the moment the address changes. The frontend must swap in the returned token or the
   * user will appear logged out on their next request.
   *
   * @param email The authenticated user's current email
   * @param req The code sent to the pending address
   * @return A JWT issued against the new email
   * @throws IllegalArgumentException If there is no pending change, it expired, too many wrong
   *     guesses were made, the code doesn't match, or the address was claimed in the meantime
   */
  @Transactional(dontRollbackOn = IncorrectVerificationCodeException.class)
  public String confirmEmailChange(String email, VerifyEmailChangeRequest req) {
    User user = requireUser(email);

    if (user.getPendingEmail() == null || user.getPendingEmailCodeHash() == null) {
      throw new IllegalArgumentException("There is no email change waiting to be confirmed.");
    }

    if (user.getPendingEmailExpiresAt() == null
            || user.getPendingEmailExpiresAt().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("That code has expired. Please start over.");
    }

    if (user.getPendingEmailAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
      throw new IllegalArgumentException("Too many incorrect attempts. Please start over.");
    }

    String enteredCode = req.getCode().trim().toUpperCase(Locale.ROOT);

    if (!passwordEncoder.matches(enteredCode, user.getPendingEmailCodeHash())) {
      user.setPendingEmailAttempts(user.getPendingEmailAttempts() + 1);
      userRepository.save(user);
      throw new IncorrectVerificationCodeException();
    }

    String newEmail = user.getPendingEmail();

    // Someone else could have registered this address while the code sat unread.
    if (userRepository.findByEmailIgnoreCase(newEmail).isPresent()) {
      clearPendingEmail(user);
      userRepository.save(user);
      throw new IllegalArgumentException("That email was claimed while you were verifying it.");
    }

    user.setEmail(newEmail);
    user.setEmailVerified(true);
    clearPendingEmail(user);

    User saved = userRepository.save(user);

    return jwtUtil.generateToken(saved.getEmail(), saved.getRole());
  }

  // ── Helpers ────────────────────────────────────────────────

  /**
   * Stamps a fresh verification session onto the account and returns the plaintext code.
   *
   * <p>The caller is responsible for saving the user and queuing the email. Only the hash is kept
   * on the entity — the plaintext is returned once, here, and never stored.
   */
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

  private User requireUser(String email) {
    return userRepository
            .findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
  }

  private void clearPendingEmail(User user) {
    user.setPendingEmail(null);
    user.setPendingEmailCodeHash(null);
    user.setPendingEmailSentAt(null);
    user.setPendingEmailExpiresAt(null);
    user.setPendingEmailAttempts(0);
  }

  /**
   * Best-effort cleanup of a replaced avatar. A storage hiccup here shouldn't fail the user's
   * request — they've already got their new picture; the old file is just litter.
   */
  private void deleteStoredImageQuietly(String imageUrl) {
    if (imageUrl == null || imageUrl.isBlank()) {
      return;
    }
    try {
      fileStorageService.deleteFile(imageUrl);
    } catch (Exception ignored) {
      // Deliberately swallowed: see method comment.
    }
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

  /**
   * Thrown on a wrong code so the attempt counter still commits.
   *
   * <p>Marked on the transaction via {@code dontRollbackOn}; without it the increment would be
   * rolled back with the exception and the attempt cap would never bite.
   */
  private static class IncorrectVerificationCodeException extends IllegalArgumentException {

    private IncorrectVerificationCodeException() {
      super("Incorrect verification code.");
    }
  }
}