package com.vsa.dto.request;

import jakarta.validation.constraints.NotNull;

public record RecruitmentStatusRequest(

    @NotNull(message = "Recruitment status is required.")
    Boolean recruitmentOpen

) {}