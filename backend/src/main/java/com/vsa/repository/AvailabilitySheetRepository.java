package com.vsa.repository;

import com.vsa.model.AvailabilitySheet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository for availability sheets.
 *
 * @author VSA Development Team
 */
@Repository
public interface AvailabilitySheetRepository extends JpaRepository<AvailabilitySheet, Long> {

    /** All sheets with creator and event loaded, for the sheet list (avoids one query per row). */
    @Query(
            """
            select s from AvailabilitySheet s
            join fetch s.createdBy
            left join fetch s.event
            """)
    List<AvailabilitySheet> findAllForList();
}
