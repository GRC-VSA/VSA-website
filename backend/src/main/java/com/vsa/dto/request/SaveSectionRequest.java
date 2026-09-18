package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/*
    This file represents the section that the VSA officers create and want to save to database.
*/
public record SaveSectionRequest(

    @NotBlank
    @Size(max = 255)
    String sectionHeading,

    @Size(max = 3000)
    String sectionDescription,

    @NotEmpty
    List<@NotNull Long> roleIds

) {}