package com.vsa.service;

import com.vsa.model.User;
import com.vsa.repository.UserRepository;
import com.vsa.security.JwtUtil;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service class for managing User authentication and account operations.
 *
 * <p>Handles user registration, email verification, login, and password management. Includes
 * integration with email service for sending verification and reset emails.
 *
 * @author VSA Development Team
 */
@Service
public class UserService {
  // ── Dependencies ──────────────────────────────────────────
  private final UserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final EmailService emailService;

  /**
   * Constructs a UserService with required dependencies.
   *
   * @param userRepository Repository for user data access
   * @param passwordEncoder Encoder for password hashing
   * @param jwtUtil Utility for JWT token generation and validation
   * @param emailService Service for sending emails
   */
  public UserService(
      UserRepository userRepository,
      BCryptPasswordEncoder passwordEncoder,
      JwtUtil jwtUtil,
      EmailService emailService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
    this.emailService = emailService;
  }

  // ── Registration & Verification ────────────────────────────

  /**
   * Registers a new user account.
   *
   * <p>Creates a new user with the provided credentials, generates a verification token, and sends
   * a verification email. The user cannot log in until email is verified.
   *
   * @param user The user with email and password
   * @return The registered user entity
   * @throws IllegalArgumentException If the email already exists
   */
  public User registerUser(User user) {
    if (userRepository.existsByEmail(user.getEmail())) {
      throw new IllegalArgumentException("Email already exists");
    }
    user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

    user.setVerificationToken(UUID.randomUUID().toString());
    user.setEmailVerified(false);
    user.setRole("student");

    User saved = userRepository.save(user);

    emailService.sendVerificationEmail(
        saved.getEmail(), saved.getFirstName(), saved.getVerificationToken());

    return saved;
  }

  /**
   * Verifies a user's email address.
   *
   * <p>Marks the email as verified and clears the verification token after successful verification.
   *
   * @param token The verification token sent to the user's email
   * @throws IllegalArgumentException If the verification token is invalid
   */
  public void verifyEmail(String token) {
    User user =
        userRepository
            .findByVerificationToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));
    user.setEmailVerified(true);
    user.setVerificationToken(null);
    userRepository.save(user);
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
}
