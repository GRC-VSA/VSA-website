package com.vsa.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OurTeamRequest {

    @NotNull
    @Positive
    private Integer generation;

    @NotBlank
    private String officerName;

    @NotBlank
    private String officerPosition;

    @NotBlank
    private String officerQuote;

    private String officerInstagramUrl;

    private String officerLinkedinUrl;

    @Email
    private String officerEmail;
}