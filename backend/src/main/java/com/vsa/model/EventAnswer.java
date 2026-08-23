package com.vsa.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a guest's answer to one custom {@link Question} as part of a {@link
 * Registration}.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@Table(name = "event_answers")
public class EventAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Long answerId;

    /** The registration this answer belongs to */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    /** The question being answered */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /** The guest's answer (for choice-based questions, the selected option's text) */
    @Column(name = "answer_value")
    private String answerValue;
}