package com.vsa.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionOptionRequest {

    private String optionText;

    private int displayOrder;
}