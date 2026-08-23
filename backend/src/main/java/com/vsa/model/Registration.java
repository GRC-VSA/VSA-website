package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
    @JoinColumn(name = "sid", nullable = false)
    private User user;

    /** Answers to the event's custom questions, submitted alongside the registration */
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventAnswer> answers = new ArrayList<>();

    // ── Registration Details ───────────────────────────────────
    /** Registration status, e.g. "confirmed" (no approval workflow yet — always set on creation) */
    @Column(nullable = false)
    private String status = "confirmed";

    /** Ticket type for this registration, e.g. "general". Defaults to "general" if not specified. */
    @Column(name = "ticket_type")
    private String ticketType = "general";

    /** Number of seats/tickets under this registration. Always 1 for now. */
    @Column(nullable = false)
    private int quantity = 1;

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