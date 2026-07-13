package com.vsa.service;

import com.vsa.model.User;
import com.vsa.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.UUID;

import com.vsa.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;

  private final BCryptPasswordEncoder passwordEncoder;

  private final JwtUtil jwtUtil;

  public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder,  JwtUtil jwtUtil) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  // Register
  public User registerUser(User user) {
    if (userRepository.existsByEmail(user.getEmail())) {
      throw new IllegalArgumentException("Email already exists");
    }
    user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

    user.setVerificationToken(UUID.randomUUID().toString());
    user.setEmailVerified(false);
    user.setRole("student");

    return userRepository.save(user);
  }

  // Verify email
  public void verifyEmail(String token) {
    User user =
        userRepository
            .findByVerificationToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));
    user.setEmailVerified(true);
    user.setVerificationToken(null); // clear token
    userRepository.save(user);
  }

  // Login
  public String login(String email, String rawPassword) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

    if (!user.isEmailVerified()) {
      throw new IllegalArgumentException("Please verify your email first");
    }

    if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid email or password");
    }

    return jwtUtil.generateToken(user.getEmail(), user.getRole());
  }

  // Forgot Password
  public void forgotPassword(String email) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Email not found"));

    user.setResetToken(UUID.randomUUID().toString());
    user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
    userRepository.save(user);

    // TODO: Send email with reset link containing the token, later
  }

  // Reset Password
  public void resetPassword(String token, String newPassword) {
    User user =
        userRepository
            .findByVerificationToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

    if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("Reset token has expired");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setResetToken(null); // clear after use
    user.setResetTokenExpiry(null);
    userRepository.save(user);
  }
}
