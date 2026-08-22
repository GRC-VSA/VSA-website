package com.vsa.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrationRequest {
    private String questionText;
    private Long questionTypeId;
    private boolean required;
    private List<String> options;
    private int displayOrder;
}

