package com.vsa.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * A to-do item one officer assigns to another.
 *
 * <p>Design notes:
 *
 * <ul>
 *   <li>{@code assignee} and {@code assignedBy} are both foreign keys to {@code users}: the
 *       database itself refuses a task pointing at a user who does not exist.
 *   <li>{@code team} is a <em>snapshot</em> of the assignee's team, copied when the task is
 *       assigned (or reassigned). Moving someone to another team later does not rewrite the
 *       history of work they did for their old one.
 *   <li>{@code dueDate} is a {@link LocalDate}: a calendar day with no time or zone, exactly what
 *       the form sends. {@code createdAt} etc. are {@link Instant}s: real points in time.
 *   <li>{@code version} enables optimistic locking: every UPDATE is {@code ... WHERE version = ?},
 *       so two people saving the same task at once cannot silently overwrite each other.
 * </ul>
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(
    name = "tasks",
    indexes = {
      @Index(name = "idx_tasks_assignee", columnList = "assignee_id"),
      @Index(name = "idx_tasks_status_due", columnList = "status, due_date")
    })
public class Task {

  /** Stored as text (EnumType.STRING), so reordering these never corrupts existing rows. */
  public enum Priority {
    LOW,
    MEDIUM,
    HIGH
  }

  public enum Status {
    TODO,
    IN_PROGRESS,
    COMPLETED
  }

  // ── Primary Key ────────────────────────────────────────────
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "task_id")
  private Long taskId;

  // ── Content ────────────────────────────────────────────────
  @Column(nullable = false, length = 150)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private Priority priority;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Status status = Status.TODO;

  // ── People and team ────────────────────────────────────────
  /** Who has to do it. LAZY: only loaded when touched (list queries fetch it with a join). */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "assignee_id", nullable = false)
  private User assignee;

  /** Who assigned it. Set from the JWT on create, never from the request body. */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "assigned_by_id", nullable = false)
  private User assignedBy;

  /** Snapshot of the assignee's team when assigned. Null if they had no team then. */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "team_id")
  private Team team;

  // ── Bookkeeping ────────────────────────────────────────────
  /** Set when status becomes COMPLETED, cleared when it leaves. Kept in step by TaskService. */
  @Column(name = "completed_at")
  private Instant completedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  /** Optimistic-lock counter. Hibernate bumps it on every update; never set it by hand. */
  @Version
  @Column(nullable = false)
  private Long version;

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    this.updatedAt = Instant.now();
  }
}
