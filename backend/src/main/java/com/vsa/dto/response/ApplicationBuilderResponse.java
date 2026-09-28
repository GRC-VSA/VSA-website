package com.vsa.dto.response;

import java.util.List;

public record ApplicationBuilderResponse(

    RecruitmentStatusResponse recruitmentStatus,

    List<ApplicationRoleResponse> roles

) {}