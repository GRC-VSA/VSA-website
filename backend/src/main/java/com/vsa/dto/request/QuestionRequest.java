package com.vsa.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for creating or updating an event question.
 *
 * <p>Used instead of the {@code Question} entity directly because the entity's relations (Event,
 * QuestionType) are JPA associations, not the plain IDs a frontend naturally sends. Answer options
 * for choice-based types live on {@code QuestionType.inputConfig} instead of here, since types
 * are seeded manually and questions just reference one.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class QuestionRequest {
    /** The question text shown to guests */
    private String questionText;

    /** ID of the QuestionType this question uses (see GET /api/question-types) */
    private Long questionTypeId;

    /** Whether the frontend should treat this question as required (not enforced server-side) */
    private boolean required;

    /** Display order of the question within the event's question list */
    private int displayOrder;
}