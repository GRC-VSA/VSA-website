package com.vsa.repository;

import com.vsa.model.Registration;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Registration entity data access.
 *
 * @author VSA Development Team
 */
@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    /**
     * Finds all registrations for a specific event.
     *
     * @param eventId The event ID
     * @return List of registrations for the event
     */
    List<Registration> findByEvent_EventId(Long eventId);

    /**
     * Counts how many guests have registered for an event so far (used for the capacity check).
     *
     * @param eventId The event ID
     * @return The number of existing registrations
     */
    long countByEvent_EventId(Long eventId);

    /**
     * Checks whether a user has already registered for a given event (duplicate-registration
     * guard).
     *
     * @param eventId The event ID
     * @param sid The user's SID
     * @return true if a registration already exists for this user/event pair
     */
    boolean existsByEvent_EventIdAndUser_Sid(Long eventId, String sid);
}