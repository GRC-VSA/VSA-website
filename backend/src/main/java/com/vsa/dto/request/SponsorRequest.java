package com.vsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SponsorRequest {

    @NotBlank
    private String name;

    private String websiteUrl;

    private String description;

    private Integer year;
}