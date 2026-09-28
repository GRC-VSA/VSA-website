package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record ApplicationAnswerRequest(

    @NotNull
    Long questionId,

    /*
     * Used for: short_text, long_text, number, email, phone, date, url
     */
    String answerText,

    /*
     * Used for: single_choice, multiple_choice
     */
    List<Long> optionIds

) {}