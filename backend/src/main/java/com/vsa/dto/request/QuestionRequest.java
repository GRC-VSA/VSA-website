package com.vsa.dto.request;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionRequest {
    private String questionText;

    private Long questionTypeId;

    private boolean required;

    private List<String> options;

    private int displayOrder;
}