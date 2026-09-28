package com.vsa.repository;

import com.vsa.model.AvailabilityInvite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvailabilityInviteRepository extends JpaRepository<AvailabilityInvite, Long> {

    Optional<AvailabilityInvite> findByToken(String token);

    List<AvailabilityInvite> findBySheet_SheetIdOrderByCreatedAtAsc(Long sheetId);
}
