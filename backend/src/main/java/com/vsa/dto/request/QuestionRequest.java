package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for creating or updating an event question.
 *
 * <p>
 * Used instead of the {@code Question} entity directly because the entity's
 * relations (Event, QuestionType) are JPA associations, not the plain IDs a
 * frontend naturally sends. Answer options for choice-based types live on
 * {@code QuestionType.inputConfig} instead of here, since types are seeded
 * manually and questions just reference one.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class QuestionRequest {

    /**
     * The question text shown to guests
     */
    @NotBlank(message = "Question text is required.")
    private String questionText;

    /**
     * ID of the QuestionType this question uses (see GET /api/question-types)
     */
    @NotNull(message = "Question type is required.")
    private Long questionTypeId;

    /**
     * Whether this question must be answered before registration can be
     * submitted
     */
    private boolean required;

    /**
     * Display order of the question within the event's question list
     */
    @PositiveOrZero(message = "Display order cannot be negative.")
    private int displayOrder;

    @Valid
    private List<QuestionOptionRequest> options;
}
