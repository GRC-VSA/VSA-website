package com.vsa.service;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.PersonRef;
import com.vsa.controller.TaskDtos.TaskResponse;
import com.vsa.controller.TaskDtos.TeamResponse;
import com.vsa.model.Task;
import com.vsa.model.Team;
import com.vsa.model.User;

/**
 * Entity-to-response conversions for tasks and teams.
 *
 * <p>Takes the viewer as an argument because some fields ({@code assignedByMe}, the permission
 * flags) depend on who is looking at the task.
 *
 * @author VSA Development Team
 */
final class TaskMapper {
  private TaskMapper() {}

  static TaskResponse toResponse(Task task, User viewer) {
    User assignedBy = task.getAssignedBy();
    return new TaskResponse(
        task.getTaskId(),
        task.getTitle(),
        task.getDescription(),
        teamName(task.getTeam()),
        person(task.getAssignee()),
        task.getDueDate(),
        task.getPriority(),
        task.getStatus(),
        fullName(assignedBy),
        roleLabel(assignedBy),
        TaskService.sameUser(assignedBy, viewer),
        TaskService.canManage(viewer, task),
        TaskService.canChangeStatus(viewer, task),
        task.getCreatedAt(),
        task.getUpdatedAt(),
        task.getCompletedAt(),
        task.getVersion());
  }

  static MemberResponse member(User user) {
    return new MemberResponse(user.getUid(), fullName(user), teamName(user.getTeam()));
  }

  static TeamResponse team(Team team) {
    return new TeamResponse(team.getTeamId(), team.getName());
  }

  static PersonRef person(User user) {
    return new PersonRef(user.getUid(), fullName(user));
  }

  static String fullName(User user) {
    return (user.getFirstName() + " " + user.getLastName()).trim();
  }

  /** "President", or "Marketing officer" when the officer has a team, else "Officer". */
  static String roleLabel(User user) {
    if (TaskService.isPresident(user)) {
      return "President";
    }
    return user.getTeam() == null ? "Officer" : user.getTeam().getName() + " officer";
  }

  private static String teamName(Team team) {
    return team == null ? null : team.getName();
  }
}
