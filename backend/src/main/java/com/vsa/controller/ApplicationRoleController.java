package com.vsa.controller;

import com.vsa.controller.ApplicationDtos.RoleResponse;
import com.vsa.controller.ApplicationDtos.SaveRoleRequest;
import com.vsa.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/application-roles")
public class ApplicationRoleController {
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

  @PostMapping("/publish")
  public List<RoleResponse> publishRecruitment() {
    return applicationService.publishRecruitment();
  }
}
