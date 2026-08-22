package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a guest's registration for an Event.
 *
 * <p>Captures the guest's contact info plus their answers to any custom questions the officer
 * attached to the event. Automatically sets creation timestamp on persistence.
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

    /** Answers to the event's custom questions, submitted alongside the registration */
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RegistrationAnswer> answers = new ArrayList<>();

    // ── Guest Information ──────────────────────────────────────
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    // ── Metadata ───────────────────────────────────────────────
    /** Timestamp when the registration was created (auto-set on creation) */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Automatically sets the creation timestamp before persisting the entity. */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}

