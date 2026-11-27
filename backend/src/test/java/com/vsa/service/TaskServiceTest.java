package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.user;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.SaveTaskRequest;
import com.vsa.controller.TaskDtos.TaskResponse;
import com.vsa.controller.TaskDtos.UpdateStatusRequest;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ForbiddenException;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Task;
import com.vsa.model.Task.Priority;
import com.vsa.model.Task.Status;
import com.vsa.model.Team;
import com.vsa.model.User;
import com.vsa.repository.TaskRepository;
import com.vsa.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TaskServiceTest {

  @Mock TaskRepository taskRepository;
  @Mock UserRepository userRepository;
  @Mock EmailOutboxService emailOutboxService;

  TaskService service;

  Team marketing;
  Team events;
  User amy; // officer, the assigner in most tests
  User ben; // officer, the assignee in most tests
  User cat; // officer, unrelated to the task
  User pres; // president
  User stu; // student

  static final LocalDate FUTURE = LocalDate.now().plusDays(30);

  @BeforeEach
  void setUp() {
    service = new TaskService(taskRepository, userRepository, emailOutboxService);
    marketing = team(1L, "Marketing");
    events = team(2L, "Event Organizing");
    amy = user("u-amy", "Amy", "Ang", "officer");
    ben = user("u-ben", "Ben", "Bui", "officer");
    ben.setTeam(marketing);
    cat = user("u-cat", "Cat", "Cao", "officer");
    cat.setTeam(events);
    pres = user("u-pres", "Pat", "Pham", "president");
    stu = user("u-stu", "Stu", "Su", "student");
    for (User u : List.of(amy, ben, cat, pres, stu)) {
      when(userRepository.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
      when(userRepository.findById(u.getUid())).thenReturn(Optional.of(u));
    }
    // save() hands back the entity with an id, like the database would.
    when(taskRepository.save(any(Task.class)))
        .thenAnswer(
            inv -> {
              Task t = inv.getArgument(0);
              t.setTaskId(99L);
              t.setVersion(0L);
              return t;
            });
    when(taskRepository.saveAndFlush(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
  }

  // ── Fixtures ───────────────────────────────────────────────

  static Team team(Long id, String name) {
    Team team = new Team();
    team.setTeamId(id);
    team.setName(name);
    return team;
  }

  /** A TODO task Amy assigned to Ben, stored with id 7. */
  Task existingTask() {
    Task task = new Task();
    task.setTaskId(7L);
    task.setTitle("Make poster");
    task.setDueDate(FUTURE);
    task.setPriority(Priority.MEDIUM);
    task.setStatus(Status.TODO);
    task.setAssignee(ben);
    task.setAssignedBy(amy);
    task.setTeam(marketing);
    task.setVersion(3L);
    when(taskRepository.findWithPeopleByTaskId(7L)).thenReturn(Optional.of(task));
    return task;
  }

  static SaveTaskRequest request(String assigneeId, LocalDate due, Long version) {
    return new SaveTaskRequest(
        "  Make poster  ", "  Spring gala  ", assigneeId, due, Priority.HIGH, version);
  }

  // ── Create ─────────────────────────────────────────────────

  @Test
  void create_setsServerOwnedFields_snapshotsTeam_andQueuesEmail() {
    TaskResponse res = service.createTask(amy.getEmail(), request("u-ben", FUTURE, null));

    ArgumentCaptor<Task> saved = ArgumentCaptor.forClass(Task.class);
    verify(taskRepository).save(saved.capture());
    Task task = saved.getValue();
    assertEquals("Make poster", task.getTitle(), "title is trimmed");
    assertEquals("Spring gala", task.getDescription());
    assertEquals(Status.TODO, task.getStatus());
    assertSame(amy, task.getAssignedBy(), "assigner comes from the JWT, not the body");
    assertSame(marketing, task.getTeam(), "team is copied from the assignee");

    assertEquals(99L, res.taskId());
    assertEquals("Marketing", res.team());
    assertEquals("u-ben", res.assignee().userId());
    assertEquals("Ben Bui", res.assignee().name());
    assertEquals("Amy Ang", res.assignedByName());
    assertEquals("Officer", res.assignedByRole());
    assertTrue(res.assignedByMe());
    assertTrue(res.canEdit());

    verify(emailOutboxService)
        .queueTaskAssignedEmail(
            eq("ben@vsa.com"),
            eq("u-ben"),
            eq("Ben"),
            eq("Make poster"),
            eq("Amy Ang"),
            eq(FUTURE.toString()),
            eq("HIGH"),
            eq("/officer/todo-list/99"));
  }

  @Test
  void create_assigningYourself_sendsNoEmail() {
    service.createTask(amy.getEmail(), request("u-amy", FUTURE, null));
    verifyNoInteractions(emailOutboxService);
  }

  @Test
  void create_rejectsStudentOrUnknownAssignee() {
    assertThrows(
        IllegalArgumentException.class,
        () -> service.createTask(amy.getEmail(), request("u-stu", FUTURE, null)));
    assertThrows(
        IllegalArgumentException.class,
        () -> service.createTask(amy.getEmail(), request("nobody", FUTURE, null)));
    verify(taskRepository, never()).save(any());
  }

  @Test
  void create_rejectsPastDueDate() {
    LocalDate past = LocalDate.now(TaskService.CLUB_ZONE).minusDays(1);
    assertThrows(
        IllegalArgumentException.class,
        () -> service.createTask(amy.getEmail(), request("u-ben", past, null)));
  }

  // ── Read ───────────────────────────────────────────────────

  @Test
  void get_missingTask_is404() {
    when(taskRepository.findWithPeopleByTaskId(5L)).thenReturn(Optional.empty());
    assertThrows(ResourceNotFoundException.class, () -> service.getTask(amy.getEmail(), 5L));
  }

  @Test
  void get_flagsDependOnTheViewer() {
    existingTask();

    TaskResponse asAssignee = service.getTask(ben.getEmail(), 7L);
    assertFalse(asAssignee.assignedByMe());
    assertFalse(asAssignee.canEdit());
    assertTrue(asAssignee.canChangeStatus());

    TaskResponse asStranger = service.getTask(cat.getEmail(), 7L);
    assertFalse(asStranger.canEdit());
    assertFalse(asStranger.canChangeStatus());

    TaskResponse asPresident = service.getTask(pres.getEmail(), 7L);
    assertTrue(asPresident.canEdit());
    assertTrue(asPresident.canChangeStatus());
  }

  @Test
  void list_mineUsesAssigneeQuery_andFiltersStatus() {
    Task task = existingTask();
    when(taskRepository.findByAssignee_UidOrderByDueDateAscTaskIdAsc("u-ben"))
        .thenReturn(List.of(task));

    assertEquals(1, service.listTasks(ben.getEmail(), true, null).size());
    assertEquals(1, service.listTasks(ben.getEmail(), true, Status.TODO).size());
    assertEquals(0, service.listTasks(ben.getEmail(), true, Status.COMPLETED).size());
    verify(taskRepository, never()).findAllByOrderByDueDateAscTaskIdAsc();
  }

  @Test
  void assignableMembers_sortedByName_withTeam() {
    when(userRepository.findWithTeamByRoleIn(TaskService.MEMBER_ROLES))
        .thenReturn(List.of(cat, amy, ben));

    List<MemberResponse> members = service.listAssignableMembers();

    assertEquals(List.of("Amy Ang", "Ben Bui", "Cat Cao"), members.stream().map(m -> m.name()).toList());
    assertNull(members.get(0).team());
    assertEquals("Marketing", members.get(1).team());
  }

  // ── Update ─────────────────────────────────────────────────

  @Test
  void update_onlyAssignerOrPresident() {
    existingTask();
    assertThrows(
        ForbiddenException.class,
        () -> service.updateTask(ben.getEmail(), 7L, request("u-ben", FUTURE, 3L)),
        "the assignee can change status but not rewrite the task");
    assertThrows(
        ForbiddenException.class,
        () -> service.updateTask(cat.getEmail(), 7L, request("u-ben", FUTURE, 3L)));
    assertDoesNotThrow(() -> service.updateTask(pres.getEmail(), 7L, request("u-ben", FUTURE, 3L)));
  }

  @Test
  void update_staleVersion_is409() {
    existingTask();
    assertThrows(
        ConflictException.class,
        () -> service.updateTask(amy.getEmail(), 7L, request("u-ben", FUTURE, 2L)));
    verify(taskRepository, never()).saveAndFlush(any());
  }

  @Test
  void update_reassign_resnapshotsTeam_andEmailsNewAssignee() {
    Task task = existingTask();

    TaskResponse res = service.updateTask(amy.getEmail(), 7L, request("u-cat", FUTURE, 3L));

    assertSame(cat, task.getAssignee());
    assertSame(events, task.getTeam());
    assertEquals("Event Organizing", res.team());
    verify(emailOutboxService)
        .queueTaskAssignedEmail(
            eq("cat@vsa.com"), any(), any(), any(), any(), any(), any(), eq("/officer/todo-list/7"));
  }

  @Test
  void update_sameAssignee_keepsTeamSnapshot_andSendsNoEmail() {
    Task task = existingTask();
    ben.setTeam(events); // Ben moved teams after the task was assigned

    service.updateTask(amy.getEmail(), 7L, request("u-ben", FUTURE, 3L));

    assertSame(marketing, task.getTeam(), "history is preserved");
    verify(emailOutboxService, never())
        .queueTaskAssignedEmail(any(), any(), any(), any(), any(), any(), any(), anyString());
  }

  @Test
  void update_mayKeepPastDueDate_butNotMoveIntoPast() {
    Task task = existingTask();
    LocalDate past = LocalDate.now(TaskService.CLUB_ZONE).minusDays(3);
    task.setDueDate(past);

    assertDoesNotThrow(() -> service.updateTask(amy.getEmail(), 7L, request("u-ben", past, 3L)));
    assertThrows(
        IllegalArgumentException.class,
        () -> service.updateTask(amy.getEmail(), 7L, request("u-ben", past.minusDays(1), 3L)));
  }

  // ── Status ─────────────────────────────────────────────────

  @Test
  void status_assigneeCanChange_strangerCannot() {
    Task task = existingTask();

    TaskResponse res =
        service.updateStatus(ben.getEmail(), 7L, new UpdateStatusRequest(Status.IN_PROGRESS));
    assertEquals(Status.IN_PROGRESS, res.status());

    assertThrows(
        ForbiddenException.class,
        () -> service.updateStatus(cat.getEmail(), 7L, new UpdateStatusRequest(Status.COMPLETED)));
    assertEquals(Status.IN_PROGRESS, task.getStatus());
  }

  @Test
  void applyStatus_keepsCompletedAtInStep() {
    Task task = new Task();
    task.setStatus(Status.TODO);
    Instant t1 = Instant.parse("2026-11-01T10:00:00Z");
    Instant t2 = Instant.parse("2026-11-02T10:00:00Z");

    TaskService.applyStatus(task, Status.COMPLETED, t1);
    assertEquals(t1, task.getCompletedAt());

    TaskService.applyStatus(task, Status.COMPLETED, t2);
    assertEquals(t1, task.getCompletedAt(), "re-completing keeps the original time");

    TaskService.applyStatus(task, Status.IN_PROGRESS, t2);
    assertNull(task.getCompletedAt(), "reopening clears it");
  }

  // ── Delete ─────────────────────────────────────────────────

  @Test
  void delete_assignerOnly() {
    Task task = existingTask();
    assertThrows(ForbiddenException.class, () -> service.deleteTask(ben.getEmail(), 7L));
    verify(taskRepository, never()).delete(any());

    service.deleteTask(amy.getEmail(), 7L);
    verify(taskRepository).delete(task);
  }

  @Test
  void roleLabel_showsTeam() {
    assertEquals("Marketing officer", TaskMapper.roleLabel(ben));
    assertEquals("Officer", TaskMapper.roleLabel(amy));
    assertEquals("President", TaskMapper.roleLabel(pres));
  }
}
