package com.vsa.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vsa.dto.request.RecruitmentStatusRequest;
import com.vsa.dto.request.RoleRecruitingRequest;
import com.vsa.dto.request.SaveApplicationBuilderRequest;
import com.vsa.dto.request.SaveQuestionRequest;
import com.vsa.dto.request.SaveRoleRequest;
import com.vsa.dto.request.SaveSectionRequest;
import com.vsa.dto.response.ApplicationBuilderResponse;
import com.vsa.dto.response.ApplicationQuestionResponse;
import com.vsa.dto.response.ApplicationRoleResponse;
import com.vsa.dto.response.ApplicationSectionResponse;
import com.vsa.dto.response.RecruitmentStatusResponse;
import com.vsa.service.ApplicationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/application-roles")
public class ApplicationRoleController {

    private final ApplicationService applicationService;

    public ApplicationRoleController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/recruitment-status")
    public RecruitmentStatusResponse getRecruitmentStatus() {
        return applicationService.getRecruitmentStatus();
    }

    @GetMapping("/open")
    public List<ApplicationRoleResponse> getOpenRoles() {
        return applicationService.getOpenRoles();
    }
    
    @PatchMapping("/recruitment-status")
    public RecruitmentStatusResponse setRecruitmentStatus(@Valid @RequestBody RecruitmentStatusRequest request) {
        return applicationService.setRecruitmentOpen(request.recruitmentOpen());
    }
    
    @GetMapping
    public List<ApplicationRoleResponse> getAllRoles() {
        return applicationService.getAllRoles();
    }
    
    @PutMapping("/builder")
    public ApplicationBuilderResponse saveApplicationBuilder(
            @Valid
            @RequestBody SaveApplicationBuilderRequest request
    ) {
    
        return applicationService.saveApplicationBuilder(request);
    }
    @GetMapping("/{roleId}")
    public ApplicationRoleResponse getRole(@PathVariable Long roleId) {
        return applicationService.getRole(roleId);
    }

    @PostMapping
    public ResponseEntity<ApplicationRoleResponse> createRole(@Valid @RequestBody SaveRoleRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationService.createRole(request));
    }

    @PutMapping("/{roleId}")
    public ApplicationRoleResponse updateRole(
            @PathVariable Long roleId,
            @Valid @RequestBody SaveRoleRequest request
    ) {
        return applicationService.updateRole(roleId, request);
    }

    @PatchMapping("/{roleId}/recruiting")
    public ApplicationRoleResponse setRoleRecruiting(
            @PathVariable Long roleId,
            @Valid @RequestBody RoleRecruitingRequest request
    ) {
        return applicationService.setRoleRecruiting(roleId, request.recruiting());
    }

    @DeleteMapping("/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable Long roleId) {
        applicationService.deleteRole(roleId);
    }

    @GetMapping("/{roleId}/sections")
    public List<ApplicationSectionResponse> getSectionsForRole(@PathVariable Long roleId) {
        return applicationService.getSectionsForRole(roleId);
    }

    @GetMapping("/sections/{sectionId}")
    public ApplicationSectionResponse getSection(@PathVariable Long sectionId) {
        return applicationService.getSection(sectionId);
    }

    @PostMapping("/sections")
    public ResponseEntity<ApplicationSectionResponse> createSection(@Valid @RequestBody SaveSectionRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationService.createSection(request));
    }

    @PutMapping("/sections/{sectionId}")
    public ApplicationSectionResponse updateSection(
            @PathVariable Long sectionId,
            @Valid @RequestBody SaveSectionRequest request
    ) {
        return applicationService.updateSection(sectionId, request);
    }

    @DeleteMapping("/sections/{sectionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSection(@PathVariable Long sectionId) {
        applicationService.deleteSection(sectionId);
    }

    @GetMapping("/questions/{questionId}")
    public ApplicationQuestionResponse getQuestion(@PathVariable Long questionId) {
        return applicationService.getQuestion(questionId);
    }

    @PostMapping("/sections/{sectionId}/questions")
    public ResponseEntity<ApplicationQuestionResponse> createQuestion(
            @PathVariable Long sectionId,
            @Valid @RequestBody SaveQuestionRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationService.createQuestion(sectionId, request));
    }

    @PutMapping("/questions/{questionId}")
    public ApplicationQuestionResponse updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody SaveQuestionRequest request
    ) {
        return applicationService.updateQuestion(questionId, request);
    }

    @DeleteMapping("/questions/{questionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateQuestion(@PathVariable Long questionId) {
        applicationService.deactivateQuestion(questionId);
    }

}
