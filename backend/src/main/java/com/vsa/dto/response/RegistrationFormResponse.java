package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrationFormResponse {

    private Long eventId;

    private String eventName;

    private String title;

    private List<RegistrationQuestionResponse> questions;
}