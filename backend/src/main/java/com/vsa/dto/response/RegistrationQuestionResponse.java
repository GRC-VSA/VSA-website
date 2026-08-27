package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrationQuestionResponse {

    private Long questionId;

    private String questionText;

    private boolean required;

    private int displayOrder;

    private Long questionTypeId;

    private String typeName;

    private List<QuestionOptionResponse> options;
}