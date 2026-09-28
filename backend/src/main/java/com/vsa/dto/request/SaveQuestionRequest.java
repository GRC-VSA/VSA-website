package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveQuestionRequest(

    @NotBlank
    @Size(max = 2000)
    String questionText,

    @NotBlank
    @Size(max = 20)
    String questionType,

    boolean required,

    List<@NotBlank @Size(max = 500) String> options

) {}