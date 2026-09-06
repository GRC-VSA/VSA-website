package com.vsa.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionOptionRequest {

    private String optionText;

    private int displayOrder;
}