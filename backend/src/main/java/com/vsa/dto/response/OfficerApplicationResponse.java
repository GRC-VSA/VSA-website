package com.vsa.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.vsa.model.OfficerApplicationStatus;

public record OfficerApplicationResponse(

    Integer applicationId,

    Long applicationRoleId,

    String roleName,

    String uid,

    String firstName,

    String lastName,

    String email,

    OfficerApplicationStatus status,

    List<ApplicationAnswerResponse> answers,

    Long currentSectionId,
    
    LocalDateTime createdAt,

    LocalDateTime updatedAt,

    LocalDateTime submittedAt

) {}