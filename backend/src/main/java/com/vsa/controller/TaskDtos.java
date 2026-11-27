package com.vsa.controller;

import com.vsa.model.Task.Priority;
import com.vsa.model.Task.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Request and response records for the officer to-do list and teams.
 *
 * <p>These are the API contract, deliberately separate from the JPA entities: the entities can
 * change shape (columns, relations) without breaking the frontend, nothing lazy or private (like a
 * password hash) can leak into JSON, and validation lives on the way in.
 *
 * <p>Fields the server owns are never accepted from the client: {@code status} on create, {@code
 * assignedBy}, {@code team}, timestamps. They come from the JWT and the database.
 */
public final class TaskDtos {
  private TaskDtos() {}

  // ── Task requests ──────────────────────────────────────────

  /**
   * Create or edit a task. {@code version} is only read on edit: send back the version you loaded,
   * and if someone else saved in between the server answers 409 instead of overwriting their work.
   */
  public record SaveTaskRequest(
      @NotBlank @Size(max = 150) String title,
      @Size(max = 2000) String description,
      @NotBlank String assigneeId,
      @NotNull LocalDate dueDate,
      @NotNull Priority priority,
      Long version) {}

  /** Move a task between TODO, IN_PROGRESS and COMPLETED. */
  public record UpdateStatusRequest(@NotNull Status status) {}

  // ── Task responses ─────────────────────────────────────────

  /** A user reference small enough to embed: {@code userId} is the user's UUID. */
  public record PersonRef(String userId, String name) {}

  /**
   * One task as a given viewer sees it. {@code assignedByMe}, {@code canEdit} and {@code
   * canChangeStatus} depend on who is asking, so they are computed per request, never stored. The
   * flags only help the UI hide buttons; the server still checks every write.
   */
  public record TaskResponse(
      Long taskId,
      String title,
      String description,
      String team,
      PersonRef assignee,
      LocalDate dueDate,
      Priority priority,
      Status status,
      String assignedByName,
      String assignedByRole,
      boolean assignedByMe,
      boolean canEdit,
      boolean canChangeStatus,
      Instant createdAt,
      Instant updatedAt,
      Instant completedAt,
      Long version) {}

  /** Someone a task can be assigned to. {@code team} is null if they have none yet. */
  public record MemberResponse(String userId, String name, String team) {}

  // ── Teams ──────────────────────────────────────────────────

  public record SaveTeamRequest(@NotBlank @Size(max = 100) String name) {}

  public record TeamResponse(Long teamId, String name) {}
}
