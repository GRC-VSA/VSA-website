package com.vsa.service;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.SaveTaskRequest;
import com.vsa.controller.TaskDtos.TaskResponse;
import com.vsa.controller.TaskDtos.UpdateStatusRequest;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ForbiddenException;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Task;
import com.vsa.model.Task.Status;
import com.vsa.model.User;
import com.vsa.repository.TaskRepository;
import com.vsa.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business rules for the officer to-do list.
 *
 * <p>Where each concern lives:
 *
 * <ul>
 *   <li><b>Who may call /api/tasks at all</b> (officer or president) is decided earlier, in {@code
 *       SecurityConfig}, from the role in the JWT.
 *   <li><b>Who may touch <em>this</em> task</b> is decided here, after loading it, by {@link
 *       #canManage} and {@link #canChangeStatus}. URL rules can't do this: they run before the
 *       task is loaded. Skipping this layer is the classic IDOR bug ("change 42 to 43 in the URL
 *       and delete someone else's task").
 * </ul>
 *
 * <p>The class is {@link Transactional}: each public method is one database transaction. Saving a
 * task and queuing its assignment email either both commit or both roll back (the transactional
 * outbox pattern; the email itself is sent later by {@link EmailOutboxProcessor}).
 *
 * @author VSA Development Team
 */
@Service
@Transactional
public class TaskService {

  /** Roles that can be assigned tasks (and, via SecurityConfig, use the to-do list at all). */
  static final Set<String> MEMBER_ROLES = Set.of("officer", "president");

  /**
   * The club's calendar. "Today" for due-date checks means today at Green River College, not on the
   * server (which runs in UTC: at 5 pm in Washington it is already tomorrow in UTC).
   */
  static final ZoneId CLUB_ZONE = ZoneId.of("America/Los_Angeles");

  private final TaskRepository taskRepository;
  private final UserRepository userRepository;
  private final EmailOutboxService emailOutboxService;

  public TaskService(
      TaskRepository taskRepository,
      UserRepository userRepository,
      EmailOutboxService emailOutboxService) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
    this.emailOutboxService = emailOutboxService;
  }

  // ── Reads ──────────────────────────────────────────────────

  /**
   * Every task, or only the caller's when {@code mine} is true, optionally limited to one status.
   *
   * <p>The status filter runs in memory: a student club has hundreds of tasks, not millions, and
   * one query shape is simpler. If this grows, move the filter into the query.
   */
  @Transactional(readOnly = true)
  public List<TaskResponse> listTasks(String email, boolean mine, Status status) {
    User viewer = requireUser(email);
    List<Task> tasks =
        mine
            ? taskRepository.findByAssignee_UidOrderByDueDateAscTaskIdAsc(viewer.getUid())
            : taskRepository.findAllByOrderByDueDateAscTaskIdAsc();
    return tasks.stream()
        .filter(task -> status == null || task.getStatus() == status)
        .map(task -> TaskMapper.toResponse(task, viewer))
        .toList();
  }

  @Transactional(readOnly = true)
  public TaskResponse getTask(String email, Long taskId) {
    User viewer = requireUser(email);
    return TaskMapper.toResponse(requireTask(taskId), viewer);
  }

  /** Officers and presidents, by name, for the "assign to" picker. */
  @Transactional(readOnly = true)
  public List<MemberResponse> listAssignableMembers() {
    return userRepository.findWithTeamByRoleIn(MEMBER_ROLES).stream()
        .sorted(Comparator.comparing(TaskMapper::fullName, String.CASE_INSENSITIVE_ORDER))
        .map(TaskMapper::member)
        .toList();
  }

  // ── Writes ─────────────────────────────────────────────────

  /**
   * Assign a new task. Any officer or president can assign. The assigner comes from the JWT, the
   * status always starts at TODO, and the team is copied from the assignee.
   */
  public TaskResponse createTask(String email, SaveTaskRequest request) {
    User actor = requireUser(email);
    User assignee = requireAssignee(request.assigneeId());
    if (request.dueDate().isBefore(today())) {
      throw new IllegalArgumentException("The due date can't be in the past");
    }

    Task task = new Task();
    applyContent(task, request);
    task.setAssignee(assignee);
    task.setTeam(assignee.getTeam());
    task.setAssignedBy(actor);
    task.setStatus(Status.TODO);
    Task saved = taskRepository.save(task);

    notifyAssignee(saved, actor);
    return TaskMapper.toResponse(saved, actor);
  }

  /**
   * Edit a task's content or reassign it. Only the assigner or the president may do this.
   *
   * <p>If the request carries the {@code version} the client loaded and it no longer matches, the
   * task changed since the form was opened, so we refuse (409) instead of silently overwriting. The
   * {@code @Version} column on Task covers the last gap: two saves racing within milliseconds.
   */
  public TaskResponse updateTask(String email, Long taskId, SaveTaskRequest request) {
    User actor = requireUser(email);
    Task task = requireTask(taskId);
    requireManager(actor, task);
    if (request.version() != null && !request.version().equals(task.getVersion())) {
      throw new ConflictException(
          "This task was changed by someone else. Reload it and try again.");
    }
    // Keeping an existing (now past) due date is fine; moving it into the past is not.
    if (!request.dueDate().equals(task.getDueDate()) && request.dueDate().isBefore(today())) {
      throw new IllegalArgumentException("The due date can't be in the past");
    }

    applyContent(task, request);
    boolean reassigned = !task.getAssignee().getUid().equals(request.assigneeId());
    if (reassigned) {
      User assignee = requireAssignee(request.assigneeId());
      task.setAssignee(assignee);
      task.setTeam(assignee.getTeam()); // re-snapshot for the new owner
    }
    // The task was loaded in this transaction, so Hibernate already tracks it: any setter call
    // becomes an UPDATE at commit even without save() ("dirty checking"). We flush now anyway so
    // the UPDATE ... WHERE version = ? runs here and the response carries the bumped version.
    Task saved = taskRepository.saveAndFlush(task);

    if (reassigned) {
      notifyAssignee(saved, actor);
    }
    return TaskMapper.toResponse(saved, actor);
  }

  /** Move a task between statuses. The assignee, the assigner or the president may do this. */
  public TaskResponse updateStatus(String email, Long taskId, UpdateStatusRequest request) {
    User actor = requireUser(email);
    Task task = requireTask(taskId);
    if (!canChangeStatus(actor, task)) {
      throw new ForbiddenException(
          "Only the assignee, the person who assigned it, or the president can change its status");
    }

    applyStatus(task, request.status(), Instant.now());
    return TaskMapper.toResponse(taskRepository.saveAndFlush(task), actor);
  }

  /** Delete a task. Only the assigner or the president may do this. */
  public void deleteTask(String email, Long taskId) {
    User actor = requireUser(email);
    Task task = requireTask(taskId);
    requireManager(actor, task);
    taskRepository.delete(task);
  }

  // ── Rules (static so they are easy to unit-test) ──────────

  /**
   * Keeps {@code completedAt} consistent with {@code status}: set when a task becomes COMPLETED,
   * kept if it was already completed, cleared when it is reopened. The only place that writes it.
   */
  static void applyStatus(Task task, Status next, Instant now) {
    if (next == Status.COMPLETED) {
      if (task.getStatus() != Status.COMPLETED || task.getCompletedAt() == null) {
        task.setCompletedAt(now);
      }
    } else {
      task.setCompletedAt(null);
    }
    task.setStatus(next);
  }

  static boolean isPresident(User user) {
    return "president".equalsIgnoreCase(user.getRole());
  }

  static boolean sameUser(User a, User b) {
    return a != null && b != null && Objects.equals(a.getUid(), b.getUid());
  }

  /** May edit, reassign or delete: the assigner or the president. */
  static boolean canManage(User user, Task task) {
    return isPresident(user) || sameUser(user, task.getAssignedBy());
  }

  /** May change status: anyone who can manage it, plus the assignee. */
  static boolean canChangeStatus(User user, Task task) {
    return canManage(user, task) || sameUser(user, task.getAssignee());
  }

  // ── Helpers ────────────────────────────────────────────────

  private static void applyContent(Task task, SaveTaskRequest request) {
    task.setTitle(request.title().trim());
    String description = request.description();
    task.setDescription(description == null || description.isBlank() ? null : description.trim());
    task.setDueDate(request.dueDate());
    task.setPriority(request.priority());
  }

  /**
   * Queue the "you have a new task" email. Writes an email_outbox row in this same transaction;
   * the scheduler sends it within seconds. Skipped when you assign something to yourself.
   */
  private void notifyAssignee(Task task, User actor) {
    User assignee = task.getAssignee();
    if (sameUser(assignee, actor)) {
      return;
    }
    emailOutboxService.queueTaskAssignedEmail(
        assignee.getEmail(),
        assignee.getUid(),
        assignee.getFirstName(),
        task.getTitle(),
        TaskMapper.fullName(actor),
        task.getDueDate().toString(),
        task.getPriority().name(),
        "/officer/todo-list/" + task.getTaskId());
  }

  private static LocalDate today() {
    return LocalDate.now(CLUB_ZONE);
  }

  private User requireUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
  }

  private User requireAssignee(String userId) {
    return userRepository
        .findById(userId)
        .filter(user -> MEMBER_ROLES.contains(user.getRole().toLowerCase()))
        .orElseThrow(
            () -> new IllegalArgumentException("Choose a member to assign this task to"));
  }

  private Task requireTask(Long taskId) {
    return taskRepository
        .findWithPeopleByTaskId(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
  }

  private static void requireManager(User user, Task task) {
    if (!canManage(user, task)) {
      throw new ForbiddenException(
          "Only the person who assigned this task or the president can do this");
    }
  }
}
