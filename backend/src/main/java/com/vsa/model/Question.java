package com.vsa.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a custom registration question attached to an Event.
 *
 * <p>Officers define these when creating an event so guests can answer them during registration
 * (e.g. dietary restrictions, t-shirt size). The question's input type is determined by {@link
 * QuestionType}, a lookup table seeded manually in the database.
 *
 * <p>{@code options} uses {@code @ElementCollection} rather than a separate entity/repository —
 * it's just a simple ordered list of strings with no independent identity of its own, so a plain
 * collection table (auto-managed by Hibernate) keeps this simple. Only meaningful for
 * choice-based question types (multiple choice, checkbox); left empty for free-text types. If you
 * later need options to carry more data (e.g. per-option pricing), this is the field to convert
 * into a proper QuestionOption entity.
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
    @Column(nullable = false)
    private boolean required = false;

    /** Order in which this question should be displayed within the event's question list */
    @Column(name = "display_order")
    private int displayOrder;

    /**
     * Answer options for choice-based question types (multiple choice, checkbox, etc). Empty/unused
     * for free-text question types.
     */
    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    @OrderColumn(name = "option_order")
    private List<String> options = new ArrayList<>();
}