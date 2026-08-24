package com.vsa.controller;

import com.vsa.model.ApplicantStatus;
import com.vsa.model.ApplicationRoleStatus;
import com.vsa.model.QuestionResponseType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public final class ApplicationDtos {
  private ApplicationDtos() {}

  public record UserProfileResponse(
      String sid,
      String firstName,
      String lastName,
      String email,
      String phone,
      String role) {}

  public record QuestionRequest(
      @NotBlank @Size(max = 2000) String prompt,
      boolean required,
      @NotNull QuestionResponseType responseType) {}

  public record SectionRequest(
      @NotBlank @Size(max = 150) String title,
      @Size(max = 2000) String description,
      @NotNull List<@Valid QuestionRequest> questions) {}

  public record SaveRoleRequest(
      @NotBlank @Size(max = 120) String name,
      @Size(max = 3000) String description,
      boolean recruiting,
      @NotNull List<@Valid SectionRequest> sections) {}

  public record QuestionResponse(
      Long questionId,
      int questionNumber,
      String prompt,
      boolean required,
      QuestionResponseType responseType) {}

  public record SectionResponse(
      Long sectionId,
      int sectionNumber,
      String title,
      String description,
      List<QuestionResponse> questions) {}

  public record RoleResponse(
      Long applicationRoleId,
      String name,
      String description,
      boolean recruiting,
      ApplicationRoleStatus status,
      List<SectionResponse> sections,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record AnswerRequest(@NotNull Long questionId, @NotBlank @Size(max = 10000) String answer) {}

  public record RoleApplicationRequest(
      @NotNull Long applicationRoleId, @NotNull List<@Valid AnswerRequest> answers) {}

  public record SubmitApplicationsRequest(
      @Size(max = 120) String preferredName,
      @Size(max = 80) String pronouns,
      @Size(max = 40) String phone,
      @NotBlank @Size(max = 160) String academicProgram,
      @NotBlank @Size(max = 80) String yearOfStudy,
      @NotEmpty List<@Valid RoleApplicationRequest> applications) {}

  public record UpdateApplicationRequest(
      @Size(max = 120) String preferredName,
      @Size(max = 80) String pronouns,
      @Size(max = 40) String phone,
      @NotBlank @Size(max = 160) String academicProgram,
      @NotBlank @Size(max = 80) String yearOfStudy,
      @NotNull List<@Valid AnswerRequest> answers) {}

  public record AnswerResponse(Long questionId, String prompt, String answer) {}

  public record SubmittedApplicationResponse(
      Long applicantId,
      Long applicationRoleId,
      String roleName,
      String sid,
      String firstName,
      String lastName,
      String email,
      String preferredName,
      String pronouns,
      String phone,
      String academicProgram,
      String yearOfStudy,
      ApplicantStatus status,
      List<AnswerResponse> answers,
      LocalDateTime submittedAt,
      LocalDateTime updatedAt) {}

  public record UpdateStatusRequest(@NotNull ApplicantStatus status) {}
}
