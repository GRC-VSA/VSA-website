package com.vsa.repository;

import com.vsa.model.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Data access for {@link Task}.
 *
 * <p>Every read that the API returns uses an {@link EntityGraph} on {@code assignee}, {@code
 * assignedBy} and {@code team}. Those relations are LAZY, so without the graph, mapping N tasks to
 * JSON would run 1 query for the tasks and then up to 3 more per task (the "N+1 problem"). The
 * graph makes Hibernate fetch them in the same query with JOINs. {@code assignedBy.team} is there
 * because the response labels the assigner as e.g. "Marketing officer" -- a second-level lazy hop
 * that would otherwise bring the N+1 back.
 *
 * @author VSA Development Team
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

  /** Every task, soonest due first. */
  @EntityGraph(attributePaths = {"assignee", "assignedBy", "assignedBy.team", "team"})
  List<Task> findAllByOrderByDueDateAscTaskIdAsc();

  /** Tasks assigned to one user, soonest due first. Backed by idx_tasks_assignee. */
  @EntityGraph(attributePaths = {"assignee", "assignedBy", "assignedBy.team", "team"})
  List<Task> findByAssignee_UidOrderByDueDateAscTaskIdAsc(String assigneeUid);

  /** One task with its people and team already loaded. ("WithPeople" is just a readable label.) */
  @EntityGraph(attributePaths = {"assignee", "assignedBy", "assignedBy.team", "team"})
  Optional<Task> findWithPeopleByTaskId(Long taskId);
}
