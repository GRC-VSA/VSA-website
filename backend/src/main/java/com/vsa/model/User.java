package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a User account in the VSA system.
 *
 * <p>Stores user credentials, profile information, and authentication tokens. Supports email
 * verification and password reset functionality.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "users")
public class User {
  // ── Primary Key ────────────────────────────────────────────
  /** Student ID (SID) - unique identifier and primary key */
  @Id
  @Column(name = "SID")
  private String sid;

  // ── Profile Information ────────────────────────────────────
  /** User's first name */
  @Column(name = "first_name", nullable = false)
  private String firstName;

  /** User's last name */
  @Column(name = "last_name", nullable = false)
  private String lastName;

  /** User's email address (unique) */
  @Column(nullable = false, unique = true)
  private String email;

  /** User's phone number (optional) */
  private String phone;

  // ── Authentication & Security ─────────────────────────────
  /** Hashed password (never stored in plain text) */
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  /** User's role in the system: "student", "officer", or "president" (default: "student") */
  @Column(nullable = false)
  private String role = "student";

  /** Whether the user's email has been verified (default: false) */
  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified = false;

  /** Token sent to user's email for email verification */
  @Column(name = "verification_token")
  private String verificationToken;

  /** Token sent to user's email for password reset */
  @Column(name = "reset_token")
  private String resetToken;

  /** Expiration time for the password reset token */
  @Column(name = "reset_token_expiry")
  private LocalDateTime resetTokenExpiry;

  // ── Metadata ───────────────────────────────────────────────
  /** Timestamp when the user account was created (auto-set on creation) */
  @Column(name = "created_at")
  private LocalDateTime createdAt;

  /** Automatically sets the creation timestamp before persisting the entity. */
  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
