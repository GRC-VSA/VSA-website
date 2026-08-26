package com.vsa.controller;

import com.vsa.controller.ApplicationDtos.RoleResponse;
import com.vsa.controller.ApplicationDtos.QuestionResponse;
import com.vsa.controller.ApplicationDtos.SaveQuestionRequest;
import com.vsa.controller.ApplicationDtos.SaveRoleRequest;
import com.vsa.controller.ApplicationDtos.SaveSectionRequest;
import com.vsa.controller.ApplicationDtos.SectionResponse;
import com.vsa.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/application-roles")
public class    ApplicationRoleController {
  private final ApplicationService applicationService;

  public ApplicationRoleController(ApplicationService applicationService) {
    this.applicationService = applicationService;
  }

  @GetMapping("/open")
  public List<RoleResponse> getOpenRoles() {
    return applicationService.getOpenRoles();
  }

  @GetMapping
  public List<RoleResponse> getAllRoles() {
    return applicationService.getAllRoles();
  }

  @GetMapping("/{roleId}")
  public RoleResponse getRole(@PathVariable Long roleId) {
    return applicationService.getRole(roleId);
  }

  @PostMapping
  public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody SaveRoleRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.saveRole(null, request));
  }

  @PutMapping("/{roleId}")
  public RoleResponse updateRole(
      @PathVariable Long roleId, @Valid @RequestBody SaveRoleRequest request) {
    return applicationService.saveRole(roleId, request);
  }

  @DeleteMapping("/{roleId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteRole(@PathVariable Long roleId) {
    applicationService.deleteRole(roleId);
  }

  @GetMapping("/sections/{sectionId}")
  public SectionResponse getSection(@PathVariable Long sectionId) {
    return applicationService.getSection(sectionId);
  }

  @PostMapping("/{roleId}/sections")
  public ResponseEntity<SectionResponse> createSection(
      @PathVariable Long roleId, @Valid @RequestBody SaveSectionRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(applicationService.createSection(roleId, request));
  }

  @PutMapping("/sections/{sectionId}")
  public SectionResponse updateSection(
      @PathVariable Long sectionId, @Valid @RequestBody SaveSectionRequest request) {
    return applicationService.updateSection(sectionId, request);
  }

  @DeleteMapping("/sections/{sectionId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSection(@PathVariable Long sectionId) {
    applicationService.deleteSection(sectionId);
  }

  @GetMapping("/questions/{questionId}")
  public QuestionResponse getQuestion(@PathVariable Long questionId) {
    return applicationService.getQuestion(questionId);
  }

  @PostMapping("/sections/{sectionId}/questions")
  public ResponseEntity<QuestionResponse> createQuestion(
      @PathVariable Long sectionId, @Valid @RequestBody SaveQuestionRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(applicationService.createQuestion(sectionId, request));
  }

  @PutMapping("/questions/{questionId}")
  public QuestionResponse updateQuestion(
      @PathVariable Long questionId, @Valid @RequestBody SaveQuestionRequest request) {
    return applicationService.updateQuestion(questionId, request);
  }

  @DeleteMapping("/questions/{questionId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteQuestion(@PathVariable Long questionId) {
    applicationService.deleteQuestion(questionId);
  }

  @PostMapping("/publish")
  public List<RoleResponse> publishRecruitment() {
    return applicationService.publishRecruitment();
  }
}
