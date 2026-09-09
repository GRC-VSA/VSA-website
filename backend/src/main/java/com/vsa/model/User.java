package com.vsa.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a User account in the VSA system.
 *
 * <p>Stores user credentials, profile information, and authentication tokens. Supports email
 * verification and password reset functionality.
 *
 * <p>Email verification uses a short numeric/alphabetic code rather than a clickable link, so a
 * user who opens the email on their phone can finish signing up on whatever device they started
 * on. The verification fields mirror the pattern already used by {@code Registration} for event
 * signup: only the BCrypt hash of the code is stored, it expires, and wrong attempts are counted.
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

  /** CloudFront/S3 URL of the user's avatar, or null if they haven't set one. */
  @Column(name = "profile_image_url")
  private String profileImageUrl;

  /** Officer applications submitted by this user. */
  @JsonIgnore
  @OneToMany(mappedBy = "user")
  private List<Applicant> applicants = new ArrayList<>();

  // ── Authentication & Security ─────────────────────────────
  /** Hashed password (never stored in plain text) */
  @JsonIgnore
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  /** User's role in the system: "student", "officer", or "president" (default: "student") */
  @Column(nullable = false)
  private String role = "student";

  /** Whether the user's email has been verified (default: false) */
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

  /** BCrypt hash of the current verification code. The plaintext code is never stored. */
  @JsonIgnore
  @Column(name = "verification_code_hash")
  private String verificationCodeHash;

  /** When the current code was emailed — used to enforce the resend cooldown. */
  @JsonIgnore
  @Column(name = "verification_code_sent_at")
  private LocalDateTime verificationCodeSentAt;

  /** When the current code stops being accepted. */
  @JsonIgnore
  @Column(name = "verification_expires_at")
  private LocalDateTime verificationExpiresAt;

  /** Number of incorrect code submissions against the current code. */
  @JsonIgnore
  @Column(name = "verification_attempts", nullable = false)
  private int verificationAttempts = 0;

  // ── Pending Email Change ───────────────────────────────────
  /**
   * Address the user wants to move to, held here until they prove they own it. The live {@code
   * email} is only overwritten once the code below is accepted, so a typo'd address can never lock
   * anyone out of their own account.
   */
  @JsonIgnore
  @Column(name = "pending_email")
  private String pendingEmail;

  /** BCrypt hash of the code sent to {@code pendingEmail}. */
  @JsonIgnore
  @Column(name = "pending_email_code_hash")
  private String pendingEmailCodeHash;

  /** When the pending-email code was sent — enforces the resend cooldown. */
  @JsonIgnore
  @Column(name = "pending_email_sent_at")
  private LocalDateTime pendingEmailSentAt;

  /** When the pending-email code stops being accepted. */
  @JsonIgnore
  @Column(name = "pending_email_expires_at")
  private LocalDateTime pendingEmailExpiresAt;

  /** Incorrect submissions against the current pending-email code. */
  @JsonIgnore
  @Column(name = "pending_email_attempts", nullable = false)
  private int pendingEmailAttempts = 0;

  // ── Password Reset ─────────────────────────────────────────
  /** Token sent to user's email for password reset */
  @JsonIgnore
  @Column(name = "reset_token")
  private String resetToken;

  /** Expiration time for the password reset token */
  @JsonIgnore
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