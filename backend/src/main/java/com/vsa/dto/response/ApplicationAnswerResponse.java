package com.vsa.dto.response;

import java.util.List;

public record ApplicationAnswerResponse(

    Long questionId,

    String questionText,

    String answerText,

    List<Long> selectedOptionIds

) {}