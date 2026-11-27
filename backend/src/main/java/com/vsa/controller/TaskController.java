package com.vsa.controller;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.SaveTaskRequest;
import com.vsa.controller.TaskDtos.TaskResponse;
import com.vsa.controller.TaskDtos.UpdateStatusRequest;
import com.vsa.model.Task.Status;
import com.vsa.service.TaskService;
import jakarta.validation.Valid;
import java.security.Principal;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the officer to-do list.
 *
 * <p>Base endpoint: /api/tasks. Officer or president JWT required (see SecurityConfig). This class
 * only translates HTTP: it reads the caller from {@link Principal} (the email JwtFilter put there),
 * validates bodies with {@code @Valid}, and picks status codes. Every rule is in {@link
 * TaskService}.
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {
  private final TaskService taskService;

  public TaskController(TaskService taskService) {
    this.taskService = taskService;
  }

  /** {@code ?mine=true} for only your tasks, {@code ?status=TODO} to filter by status. */
  @GetMapping
  public List<TaskResponse> listTasks(
      Principal principal,
      @RequestParam(defaultValue = "false") boolean mine,
      @RequestParam(required = false) Status status) {
    return taskService.listTasks(principal.getName(), mine, status);
  }

  /** Declared before /{taskId} for readability; Spring prefers the literal path either way. */
  @GetMapping("/assignable-members")
  public List<MemberResponse> listAssignableMembers() {
    return taskService.listAssignableMembers();
  }

  @GetMapping("/{taskId}")
  public TaskResponse getTask(Principal principal, @PathVariable Long taskId) {
    return taskService.getTask(principal.getName(), taskId);
  }

  @PostMapping
  public ResponseEntity<TaskResponse> createTask(
      Principal principal, @Valid @RequestBody SaveTaskRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(taskService.createTask(principal.getName(), request));
  }

  @PutMapping("/{taskId}")
  public TaskResponse updateTask(
      Principal principal, @PathVariable Long taskId, @Valid @RequestBody SaveTaskRequest request) {
    return taskService.updateTask(principal.getName(), taskId, request);
  }

  @PatchMapping("/{taskId}/status")
  public TaskResponse updateStatus(
      Principal principal,
      @PathVariable Long taskId,
      @Valid @RequestBody UpdateStatusRequest request) {
    return taskService.updateStatus(principal.getName(), taskId, request);
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<Void> deleteTask(Principal principal, @PathVariable Long taskId) {
    taskService.deleteTask(principal.getName(), taskId);
    return ResponseEntity.noContent().build();
  }
}
