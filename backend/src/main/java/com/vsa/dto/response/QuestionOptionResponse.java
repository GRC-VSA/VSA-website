package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionOptionResponse {

    private Long optionId;

    private String optionText;

    private int displayOrder;
}