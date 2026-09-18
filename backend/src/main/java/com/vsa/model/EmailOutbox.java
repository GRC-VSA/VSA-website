package com.vsa.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_outbox")
@Getter
@Setter
public class EmailOutbox {

    public enum EmailType {REGISTRATION_VERIFICATION, REGISTRATION_CONFIRMATION, ACCOUNT_VERIFICATION}

    public enum Status {PENDING, PROCESSING, SENT,  FAILED}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "outbox_id")
    private Long outboxId;

    /*
     * Registration this email belongs to.
     *
     * This is intentionally just an ID rather than a JPA relationship.
     * The outbox should remain independent from Registration.
     *
     * Null for emails that aren't about an event registration.
     */
    @Column(name = "registration_id")
    private Long registrationId;

    @Column(name = "user_uid")
    private String userUid;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false, length = 50)
    private EmailType emailType;

    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    /*
     * JSON containing the information required to build the email.
     */
    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processing_started_at")
    private LocalDateTime processingStartedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null) {
            status = Status.PENDING;
        }
    }
}