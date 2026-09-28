package com.vsa.dto.response;

import java.util.List;

public record ApplicationSectionResponse(

    Long sectionId,

    Integer displayOrder,

    String sectionHeading,

    String sectionDescription,

    String systemKey,

    List<Long> roleIds,

    List<ApplicationQuestionResponse> questions

) {}