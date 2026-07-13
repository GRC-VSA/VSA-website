package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "users")
public class User {
  @Id
  @Column(name = "SID")
  private String sid;

  @Column(name = "first_name", nullable = false)
  private String firstName;

  @Column(name = "last_name", nullable = false)
  private String lastName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  private String phone;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private String role = "student"; // student, officer, president

  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified = false;

  @Column(name = "verification_token")
  private String verificationToken;

  @Column(name = "reset_token")
  private String resetToken;

  @Column(name = "reset_token_expiry")
  private LocalDateTime resetTokenExpiry;

  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
