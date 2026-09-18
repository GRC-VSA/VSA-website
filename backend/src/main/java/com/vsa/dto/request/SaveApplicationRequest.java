package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SaveApplicationRequest(

    @NotNull
    List<@Valid ApplicationAnswerRequest> answers

) {}