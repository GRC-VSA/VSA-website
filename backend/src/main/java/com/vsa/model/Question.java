package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a custom registration question attached to an Event.
 *
 * <p>Officers define these when creating an event so guests can answer them during registration
 * (e.g. dietary restrictions, t-shirt size). The question's input type — including any answer
 * options — is determined by {@link QuestionType}, a lookup table seeded manually in the
 * database.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@Table(name = "event_questions")
public class Question {
    // ── Primary Key ────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    // ── Relations ──────────────────────────────────────────────
    /** The event this question belongs to */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** The input type of this question (text, multiple choice, etc.) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_type_id", nullable = false)
    private QuestionType questionType;

    // ── Question Details ───────────────────────────────────────
    /** The question text shown to guests */
    @Column(name = "question_text", nullable = false)
    private String questionText;

    /** Whether this question is required. Enforced on the frontend only for now. */
    @Column(name = "is_required", nullable = false)
    private boolean isRequired = false;

    /** Order in which this question should be displayed within the event's question list */
    @Column(name = "display_order")
    private int displayOrder;

    /** Whether this question is currently active. Not wired into any endpoint yet — defaults to
     *  true on creation. Flag if you want a way to toggle this via the API. */
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // ── Metadata ───────────────────────────────────────────────
    /** Timestamp when the question was created (auto-set on creation) */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Automatically sets the creation timestamp before persisting the entity. */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<QuestionOption> options = new ArrayList<>();
}