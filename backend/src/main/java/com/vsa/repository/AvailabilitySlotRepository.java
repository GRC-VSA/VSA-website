package com.vsa.repository;

import com.vsa.model.AvailabilitySlot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for availability slots.
 *
 * @author VSA Development Team
 */
@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {

    /**
     * Heatmap source: rows of [slotStart (Instant), number of people free (Long)]. Only counts leave
     * this query, never who picked which slot.
     */
    @Query(
            """
            select s.slotStart, count(s) from AvailabilitySlot s
            where s.participant.sheet.sheetId = :sheetId
            group by s.slotStart
            """)
    List<Object[]> countPeoplePerSlot(@Param("sheetId") Long sheetId);
}
