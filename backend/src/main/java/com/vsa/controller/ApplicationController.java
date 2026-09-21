package com.vsa.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vsa.dto.request.SaveApplicationRequest;
import com.vsa.dto.response.ApplicationOverviewResponse;
import com.vsa.dto.response.ApplicationReviewResponse;
import com.vsa.dto.response.OfficerApplicationResponse;
import com.vsa.model.OfficerApplicationStatus;
import com.vsa.service.ApplicationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/start/{roleId}")
    public OfficerApplicationResponse startApplication(Principal principal, @PathVariable Long roleId) {
        return applicationService.startApplication(principal.getName(), roleId);
    }

    @GetMapping("/mine")
    public List<OfficerApplicationResponse> getMyApplications(Principal principal) {
        return applicationService.getMyApplications(principal.getName());
    }

    @GetMapping("/mine/{applicationId}")
    public OfficerApplicationResponse getMyApplication(Principal principal, @PathVariable Integer applicationId) {
        return applicationService.getMyApplication(principal.getName(), applicationId);
    }

    @PutMapping("/mine/{applicationId}")
    public OfficerApplicationResponse saveApplication(
            Principal principal,
            @PathVariable Integer applicationId,
            @Valid @RequestBody SaveApplicationRequest request
    ) {
        return applicationService.saveApplication(principal.getName(), applicationId, request);
    }

    @PostMapping("/mine/{applicationId}/submit")
    public OfficerApplicationResponse submitApplication(
            Principal principal,
            @PathVariable Integer applicationId,
            @Valid @RequestBody SaveApplicationRequest request
    ) {
        return applicationService.submitApplication(principal.getName(), applicationId, request);
    }

    @GetMapping("/overview")
    public ApplicationOverviewResponse getApplicationOverview() {
        return applicationService.getApplicationOverview();
    }

    @GetMapping
    public List<OfficerApplicationResponse> getAllApplications(@RequestParam(required = false) OfficerApplicationStatus status) {
        return applicationService.getAllApplications(status);
    }

    @GetMapping("/{applicationId}/review")
    public ApplicationReviewResponse getSubmittedApplicationReview(@PathVariable Integer applicationId) {
        return applicationService.getSubmittedApplicationReview(applicationId);
    }

    @GetMapping("/{applicationId}")
    public OfficerApplicationResponse getApplication(@PathVariable Integer applicationId) {
        return applicationService.getApplication(applicationId);
    }
}
