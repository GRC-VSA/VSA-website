package com.vsa.dto.request;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * A single question/answer pair submitted as part of a registration.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class AnswerRequest {

    /** ID of the Question being answered */
    private Long questionId;

    /**
     * Text value for text, email, phone, number, date,
     * URL, and other non-choice questions.
     */
    private String answerValue;

    /**
     * Selected option IDs for single-choice and
     * multiple-choice questions.
     */
    private List<Long> selectedOptionIds;
}