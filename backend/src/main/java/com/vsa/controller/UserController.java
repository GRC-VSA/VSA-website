package com.vsa.controller;

import com.vsa.model.User;
import com.vsa.service.UserService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for managing User authentication and account operations.
 *
 * <p>Provides endpoints for user registration, login, email verification, and password management.
 * All endpoints return JSON responses with appropriate HTTP status codes.
 *
 * <p>Base endpoint: /api/users
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
  // ── Dependencies ──────────────────────────────────────────
  private final UserService userService;

  /**
   * Constructs a UserController with required dependencies.
   *
   * @param userService Service for user operations
   */
  public UserController(UserService userService) {
    this.userService = userService;
  }

  // ── Registration & Verification ────────────────────────────

  /**
   * Registers a new user account.
   *
   * <p>A verification email will be sent to the user's email address. The user must verify their
   * email before they can log in to the system.
   *
   * <p>Endpoint: POST /api/users/register
   *
   * @param user The user details including email, password, first name, and last name
   * @return ResponseEntity with status 201 (Created) and the registered user details
   */
  @PostMapping("/register")
  public ResponseEntity<?> registerUser(@RequestBody User user) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(user));
  }

  /**
   * Verifies a user's email address using a verification token.
   *
   * <p>The token is typically sent to the user via email during registration. After successful
   * verification, the user can log in to the system.
   *
   * <p>Endpoint: GET /api/users/verify?token=abc123
   *
   * @param token The verification token sent to the user's email
   * @return ResponseEntity with status 200 (OK) and a success message
   */
  @GetMapping("/verify")
  public ResponseEntity<?> verifyEmail(@RequestParam String token) {
    userService.verifyEmail(token);
    return ResponseEntity.ok("Email verified successfully");
  }

  // ── Authentication ──────────────────────────────────────────

  /**
   * Authenticates a user with email and password.
   *
   * <p>On successful authentication, returns a JWT token that can be used for subsequent
   * authenticated requests. The user must have verified their email before logging in.
   *
   * <p>Endpoint: POST /api/users/login
   *
   * @param body A map containing "email" and "password" fields
   * @return ResponseEntity containing the JWT token and a success message
   */
  @PostMapping("/login")
  public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
    String token = userService.login(body.get("email"), body.get("password"));
    return ResponseEntity.ok(Map.of("token", token, "message", "Login successful"));
  }

  // ── Password Management ────────────────────────────────────

  /**
   * Initiates a password reset process for a user.
   *
   * <p>A password reset link will be sent to the user's email address. The link is valid for 30
   * minutes from the time this endpoint is called.
   *
   * <p>Endpoint: POST /api/users/forgot-password
   *
   * @param body A map containing the "email" field
   * @return ResponseEntity with status 200 (OK) and a confirmation message
   */
  @PostMapping("/forgot-password")
  public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> body) {
    userService.forgotPassword(body.get("email"));
    return ResponseEntity.ok("Reset link sent to your email");
  }

  /**
   * Resets a user's password using a reset token.
   *
   * <p>The reset token is sent to the user via email when they use the forgot-password endpoint.
   * The token must be valid (not expired) for this operation to succeed.
   *
   * <p>Endpoint: POST /api/users/reset-password
   *
   * @param body A map containing "token" and "newPassword" fields
   * @return ResponseEntity with status 200 (OK) and a success message
   */
  @PostMapping("/reset-password")
  public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> body) {
    userService.resetPassword(body.get("token"), body.get("newPassword"));
    return ResponseEntity.ok("Password reset successfully");
  }
}
