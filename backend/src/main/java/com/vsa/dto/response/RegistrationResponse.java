package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationResponse {
    private Long registrationId;

    private String studentEmail;

    private String status;

    private String ticketType;
}
