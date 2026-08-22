package com.vsa.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrationRequest {
    private String firstName;
    private String lastName;
    private String email;
    private List<AnswerRequest> answers;
}

