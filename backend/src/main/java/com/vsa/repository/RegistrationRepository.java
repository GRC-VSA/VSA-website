package com.vsa.repository;

import com.vsa.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByEvent_EventId(Long EventId);

    long countByEvent_EventId(Long eventId);

    boolean existsByEvent_EventIdAndEmailIgnoreCase(Long eventId, String mail);
}
