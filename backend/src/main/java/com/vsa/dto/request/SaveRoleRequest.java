package com.vsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/*
    This file represents that officer position that VSA officers want to add to the recruitment program
*/
public record SaveRoleRequest(

    @NotBlank
    @Size(max = 255)
    String name,

    @Size(max = 3000)
    String description

) {}