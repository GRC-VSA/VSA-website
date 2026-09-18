package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a logged-in user's registration for an Event.
 *
 * <p>Unlike a fully anonymous guest form, registration is tied to an authenticated {@link User}
 * account (via {@code sid}) rather than free-text name/email fields. Automatically sets the
 * registration timestamp on persistence.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@Table(name = "registrations")
public class Registration {
    // ── Primary Key ────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Long registrationId;

    // ── Relations ──────────────────────────────────────────────
    /** The event this registration is for */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** The user who registered, resolved from the authenticated JWT at request time */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sid", nullable = true)
    private User user;

    /** Answers to the event's custom questions, submitted alongside the registration */
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventAnswer> answers = new ArrayList<>();

    // ── Registration Details ───────────────────────────────────
    /**
     * Student email submitted in the registration form.
     * This is the email that must be verified.
     */
    @Column(name = "student_email", length = 320)
    private String studentEmail;

    /**
     * Registration status.
     *
     * Expected values for now:
     * - pending_email_verification
     * - confirmed
     */
    @Column(nullable = false)
    private String status = "pending_email_verification";


    /** Ticket type for this registration, e.g. "general". Defaults to "general" if not specified. */
    @Column(name = "ticket_type")
    private String ticketType = "general";

    /** Number of seats/tickets under this registration. Always 1 for now. */
    @Column(nullable = false)
    private int quantity = 1;

    // ── Email Verification ─────────────────────────────────────

    /**
     * Public identifier used by the frontend verification page.
     *
     * Example:
     * /events/23/registration/verify/{verificationId}
     */
    @Column(name = "verification_id", unique = true)
    private UUID verificationId;

    /**
     * Hash of the verification code.
     *
     * Never store the actual verification code in the database.
     */
    @Column(name = "verification_code_hash", length = 100)
    private String verificationCodeHash;

    @Column(name = "verification_code_sent_at")
    private LocalDateTime verificationCodeSentAt;

    /** Time when the current verification code expires */
    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    /** Number of incorrect verification attempts */
    @Column(name = "verification_attempts", nullable = false)
    private int verificationAttempts = 0;

    /** Time when the student email was successfully verified */
    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    // ── Metadata ───────────────────────────────────────────────
    /** Timestamp when the registration was created (auto-set on creation) */
    @Column(name = "registered_at")
    private LocalDateTime registeredAt;


    /** Automatically sets the registration timestamp before persisting the entity. */
    @PrePersist
    public void prePersist() {
        this.registeredAt = LocalDateTime.now();
    }
}