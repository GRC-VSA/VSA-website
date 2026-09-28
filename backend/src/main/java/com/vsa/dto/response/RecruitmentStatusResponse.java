package com.vsa.dto.response;

import java.time.LocalDateTime;

public record RecruitmentStatusResponse(

    boolean recruitmentOpen,

    LocalDateTime updatedAt

) {}