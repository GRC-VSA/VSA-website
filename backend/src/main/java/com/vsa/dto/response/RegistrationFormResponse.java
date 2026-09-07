package com.vsa.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrationFormResponse {

    private Long eventId;

    private String eventName;

    /* the 'imageUrl' field gives the option to display the event image in the event registration form.
    However, frontend is not displaying event image right now  */
    private String imageUrl;

    private LocalDate eventDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    private List<RegistrationQuestionResponse> questions;
}