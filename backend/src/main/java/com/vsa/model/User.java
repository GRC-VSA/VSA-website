package com.vsa.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a User account in the VSA system.
 *
 * <p>Stores user credentials, profile information, and authentication tokens.
 * Supports email verification and password reset functionality.
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

  /** Auto-generated unique identifier and primary key */
  @Id
  @Column(name = "uid")
  @GeneratedValue(strategy = GenerationType.UUID)
  private String uid;


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


  // ── Officer Applications ───────────────────────────────────

  /**
   * Officer applications created by this user.
   *
   * One user may have multiple applications, but only one
   * application per officer role.
   */
  @JsonIgnore
  @OneToMany(mappedBy = "user")
  private List<OfficerApplication> officerApplications = new ArrayList<>();


  // ── Authentication & Security ─────────────────────────────

  /** Hashed password (never stored in plain text) */
  @JsonIgnore
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  /** User's role: "student", "officer", or "president" */
  @Column(nullable = false)
  private String role = "student";

  /** Whether the user's email has been verified */
  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified = false;

  // ── Email Verification (code-based) ────────────────────────
  /**
   * Opaque handle for the current verification session, returned to the frontend so it can submit
   * the code without ever sending the email address back. Regenerated each time a new code is
   * issued.
   */
  @JsonIgnore
  @Column(name = "verification_id")
  private UUID verificationId;

  @JsonIgnore
  @Column(name = "verification_code_hash")
  private String verificationCodeHash;

  @JsonIgnore
  @Column(name = "verification_code_sent_at")
  private LocalDateTime verificationCodeSentAt;

  @JsonIgnore
  @Column(name = "verification_expires_at")
  private LocalDateTime verificationExpiresAt;

  @JsonIgnore
  @Column(name = "verification_attempts", nullable = false)
  private int verificationAttempts = 0;

  /** Token sent to user's email for password reset */
  @Column(name = "reset_token")
  private String resetToken;

  /** Expiration time for the password reset token */
  @Column(name = "reset_token_expiry")
  private LocalDateTime resetTokenExpiry;


  // ── Metadata ───────────────────────────────────────────────

  /** Timestamp when the user account was created */
  @Column(name = "created_at")
  private LocalDateTime createdAt;

  /** Automatically sets creation timestamp before persisting */
  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}