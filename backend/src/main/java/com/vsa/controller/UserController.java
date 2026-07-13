package com.vsa.controller;

import com.vsa.model.User;
import com.vsa.service.UserService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  // POST /api/users/register
  @PostMapping("/register")
  public ResponseEntity<?> registerUser(@RequestBody User user) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(user));
  }

  // GET /api/users/verify?token=abc123
  @GetMapping("/verify")
  public ResponseEntity<?> verifyEmail(@RequestParam String token) {
    userService.verifyEmail(token);
    return ResponseEntity.ok("Email verified successfully");
  }

  // POST /api/users/login
  @PostMapping("/login")
  public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
    String token = userService.login(body.get("email"), body.get("password"));
    return ResponseEntity.ok(Map.of(
            "token", token,
            "message", "Login successful"
    ));
  }

  // POST /api/users/forgot-password
  @PostMapping("/forgot-password")
  public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> body) {
    userService.forgotPassword(body.get("email"));
    return ResponseEntity.ok("Reset link sent to your email");
  }

  // POST /api/users/reset-password
  @PostMapping("/reset-password")
  public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> body) {
    userService.resetPassword(body.get("token"), body.get("newPassword"));
    return ResponseEntity.ok("Password reset successfully");
  }
}
