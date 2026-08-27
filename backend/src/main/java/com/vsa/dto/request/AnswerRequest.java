package com.vsa.dto.request;

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

    /** The guest's answer text */
    private String answerText;
}