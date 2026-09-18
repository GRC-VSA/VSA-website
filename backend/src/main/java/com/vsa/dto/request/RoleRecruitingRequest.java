package com.vsa.dto.request;

import jakarta.validation.constraints.NotNull;

public record RoleRecruitingRequest(
        @NotNull(message = "Recruiting status is required.")
        Boolean recruiting
        ) {
}
