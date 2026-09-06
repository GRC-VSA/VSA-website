package com.vsa.controller;

import com.vsa.controller.ApplicationDtos.*;
import com.vsa.model.ApplicantStatus;
import com.vsa.service.ApplicationService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
  private final ApplicationService applicationService;

  public ApplicationController(ApplicationService applicationService) {
    this.applicationService = applicationService;
  }

  @PostMapping
  public ResponseEntity<List<SubmittedApplicationResponse>> submit(
      Principal principal, @Valid @RequestBody SubmitApplicationsRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(applicationService.submitApplications(principal.getName(), request));
  }

  @GetMapping("/mine")
  public List<SubmittedApplicationResponse> getMine(Principal principal) {
    return applicationService.getMyApplications(principal.getName());
  }

  @GetMapping("/mine/{applicantId}")
  public SubmittedApplicationResponse getMine(
      Principal principal, @PathVariable Long applicantId) {
    return applicationService.getMyApplication(principal.getName(), applicantId);
  }

  @PutMapping("/mine/{applicantId}")
  public SubmittedApplicationResponse updateMine(
      Principal principal,
      @PathVariable Long applicantId,
      @Valid @RequestBody UpdateApplicationRequest request) {
    return applicationService.updateMyApplication(principal.getName(), applicantId, request);
  }

  @DeleteMapping("/mine/{applicantId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void withdraw(Principal principal, @PathVariable Long applicantId) {
    applicationService.deleteMyApplication(principal.getName(), applicantId);
  }

  @GetMapping
  public List<SubmittedApplicationResponse> getAll(
      @RequestParam(required = false) ApplicantStatus status) {
    return applicationService.getAllApplications(status);
  }

  @GetMapping("/{applicantId}")
  public SubmittedApplicationResponse getOne(@PathVariable Long applicantId) {
    return applicationService.getApplication(applicantId);
  }

  @PatchMapping("/{applicantId}/status")
  public SubmittedApplicationResponse updateStatus(
      @PathVariable Long applicantId, @Valid @RequestBody UpdateStatusRequest request) {
    return applicationService.updateStatus(applicantId, request.status());
  }

  @DeleteMapping("/{applicantId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long applicantId) {
    applicationService.deleteApplication(applicantId);
  }
}
