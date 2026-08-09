package com.vsa.repository;

import com.vsa.model.Event;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Event entity data access.
 *
 * <p>Extends JpaRepository to provide CRUD operations on Event entities. Includes custom queries
 * for event status filtering.
 *
 * @author VSA Development Team
 */
@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
  /**
   * Finds all events with a specific status.
   *
   * @param status The event status to search for (e.g., "upcoming", "ongoing", "archived")
   * @return List of events matching the specified status
   */
  List<Event> findByStatus(String status);
}
