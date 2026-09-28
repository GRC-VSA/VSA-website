package com.vsa.dto.response;

import java.util.List;

public record ApplicationQuestionResponse(

    Long questionId,

    String questionText,

    String questionType,

    boolean required,

    int orderNum,

    boolean active,

    List<QuestionOptionResponse> options

) {}