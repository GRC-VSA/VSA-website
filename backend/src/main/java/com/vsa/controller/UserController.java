package com.vsa.controller;

import com.vsa.dto.request.AccountResendRequest;
import com.vsa.dto.request.AccountVerificationRequest;
import com.vsa.dto.request.ChangeEmailRequest;
import com.vsa.dto.request.ChangePasswordRequest;
import com.vsa.dto.request.UpdateProfileRequest;
import com.vsa.dto.request.VerifyEmailChangeRequest;
import com.vsa.dto.response.AccountVerificationStartResponse;
import com.vsa.dto.response.EmailChangeStartResponse;
import com.vsa.model.User;
import com.vsa.service.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

  @GetMapping("/me")
  public ResponseEntity<ApplicationDtos.UserProfileResponse> getCurrentUser(Principal principal) {
    return ResponseEntity.ok(userService.getProfile(principal.getName()));
  }

  // ── Registration & Verification ────────────────────────────

  /**
   * Registers a new user account.
   *
   * <p>A verification code is emailed to the address provided. The account cannot log in until
   * that code is submitted to {@code POST /api/users/verify}.
   *
   * <p>Endpoint: POST /api/users/register
   *
   * @param user The user details including email, password, first name, and last name
   * @return ResponseEntity with status 201 (Created) and the verification session details
   */
  @PostMapping("/register")
  public ResponseEntity<AccountVerificationStartResponse> registerUser(@RequestBody User user) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(user));
  }

  /**
   * Verifies a user's email address using the code from their verification email.
   *
   * <p>On success the user is logged in automatically — the response carries a JWT, so the
   * frontend does not need to ask for credentials again.
   *
   * <p>Endpoint: POST /api/users/verify
   *
   * @param request The verification session handle and the submitted code
   * @return ResponseEntity with status 200 (OK), a JWT, and a success message
   */
  @PostMapping("/verify")
  public ResponseEntity<Map<String, String>> verifyEmail(
          @RequestBody AccountVerificationRequest request) {
    String token = userService.verifyEmail(request);
    return ResponseEntity.ok(Map.of("token", token, "message", "Email verified successfully"));
  }

  /**
   * Sends a fresh verification code to a pending, unverified account.
   *
   * <p>Endpoint: POST /api/users/resend-verification
   *
   * @param request The email address of the pending account
   * @return ResponseEntity with status 200 (OK) and the new verification session details
   */
  @PostMapping("/resend-verification")
  public ResponseEntity<AccountVerificationStartResponse> resendVerification(
          @RequestBody AccountResendRequest request) {
    return ResponseEntity.ok(userService.resendVerificationCode(request));
  }


  // ── Account Management ─────────────────────────────────────

  /**
   * Updates the current user's name and phone.
   *
   * <p>Omitted fields are left as they are. Email and password are not editable here — each has
   * its own endpoint because each requires proving identity first.
   *
   * <p>Endpoint: PATCH /api/users/me
   *
   * @param principal The authenticated user
   * @param request The fields to change
   * @return The updated profile
   */
  @PatchMapping("/me")
  public ResponseEntity<ApplicationDtos.UserProfileResponse> updateProfile(
          Principal principal, @Valid @RequestBody UpdateProfileRequest request) {
    return ResponseEntity.ok(userService.updateProfile(principal.getName(), request));
  }

  /**
   * Uploads or replaces the current user's avatar.
   *
   * <p>Endpoint: POST /api/users/me/avatar (multipart/form-data, field name "image")
   *
   * @param principal The authenticated user
   * @param image The image file
   * @return The updated profile, including the new image URL
   */
  @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApplicationDtos.UserProfileResponse> updateAvatar(
          Principal principal, @RequestPart("image") MultipartFile image) {
    return ResponseEntity.ok(userService.updateAvatar(principal.getName(), image));
  }

  /**
   * Removes the current user's avatar.
   *
   * <p>Endpoint: DELETE /api/users/me/avatar
   *
   * @param principal The authenticated user
   * @return The updated profile
   */
  @DeleteMapping("/me/avatar")
  public ResponseEntity<ApplicationDtos.UserProfileResponse> removeAvatar(Principal principal) {
    return ResponseEntity.ok(userService.removeAvatar(principal.getName()));
  }

  /**
   * Changes the current user's password.
   *
   * <p>Endpoint: POST /api/users/me/password
   *
   * @param principal The authenticated user
   * @param request The current and new passwords
   * @return ResponseEntity with status 200 (OK) and a confirmation message
   */
  @PostMapping("/me/password")
  public ResponseEntity<String> changePassword(
          Principal principal, @Valid @RequestBody ChangePasswordRequest request) {
    userService.changePassword(principal.getName(), request);
    return ResponseEntity.ok("Password changed successfully");
  }

  /**
   * Starts an email change by sending a code to the proposed new address.
   *
   * <p>The account keeps its current email until that code is confirmed.
   *
   * <p>Endpoint: POST /api/users/me/email
   *
   * @param principal The authenticated user
   * @param request The current password and desired new address
   * @return The masked destination address and the code's expiry
   */
  @PostMapping("/me/email")
  public ResponseEntity<EmailChangeStartResponse> startEmailChange(
          Principal principal, @Valid @RequestBody ChangeEmailRequest request) {
    return ResponseEntity.ok(userService.startEmailChange(principal.getName(), request));
  }

  /**
   * Confirms an email change with the code sent to the new address.
   *
   * <p>Returns a replacement JWT. The caller's existing token was issued against the old email and
   * stops working immediately, so the frontend must store this one in its place.
   *
   * <p>Endpoint: POST /api/users/me/email/verify
   *
   * @param principal The authenticated user
   * @param request The code from the new address
   * @return ResponseEntity with a fresh JWT and a success message
   */
  @PostMapping("/me/email/verify")
  public ResponseEntity<Map<String, String>> confirmEmailChange(
          Principal principal, @Valid @RequestBody VerifyEmailChangeRequest request) {
    String token = userService.confirmEmailChange(principal.getName(), request);
    return ResponseEntity.ok(Map.of("token", token, "message", "Email updated successfully"));
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