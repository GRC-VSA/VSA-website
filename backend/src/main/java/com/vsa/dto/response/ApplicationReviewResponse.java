package com.vsa.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * This response file is for viewing one specific application in the Officer side
 */
public record ApplicationReviewResponse(
    Integer applicationId,

    Long applicationRoleId,

    String roleName,

    String firstName,

    String lastName,

    String email,

    LocalDateTime createdAt,

    LocalDateTime submittedAt,

    List<SectionReviewResponse> sections

) {

    public record SectionReviewResponse(

        Long sectionId,

        String sectionHeading,

        String sectionDescription,

        List<QuestionReviewResponse> questions

    ) {}


    public record QuestionReviewResponse(

        Long questionId,

        String questionText,

        String questionType,

        boolean required,

        Integer orderNum,

        String answerText,

        List<String> selectedOptions

    ) {}
}