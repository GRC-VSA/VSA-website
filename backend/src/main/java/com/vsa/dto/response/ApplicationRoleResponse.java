package com.vsa.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ApplicationRoleResponse(

    Long applicationRoleId,

    String name,

    String description,

    boolean recruiting,

    List<ApplicationSectionResponse> sections,

    LocalDateTime createdAt,

    LocalDateTime updatedAt

) {}