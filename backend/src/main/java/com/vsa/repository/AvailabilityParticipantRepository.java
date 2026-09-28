package com.vsa.repository;

import com.vsa.model.AvailabilityParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for availability entries (one per person per sheet).
 *
 * @author VSA Development Team
 */
@Repository
public interface AvailabilityParticipantRepository
        extends JpaRepository<AvailabilityParticipant, Long> {

    Optional<AvailabilityParticipant> findBySheet_SheetIdAndUser_Uid(Long sheetId, String uid);

    Optional<AvailabilityParticipant> findBySheet_SheetIdAndGuestEmailIgnoreCase(
            Long sheetId, String guestEmail);

    Optional<AvailabilityParticipant> findBySheet_SheetIdAndEditTokenHash(
            Long sheetId, String editTokenHash);

    long countBySheet_SheetId(Long sheetId);

    boolean existsBySheet_SheetId(Long sheetId);

    /** Everyone on a sheet, with officer accounts loaded for their names. */
    @Query(
            """
            select p from AvailabilityParticipant p
            left join fetch p.user
            where p.sheet.sheetId = :sheetId
            """)
    List<AvailabilityParticipant> findAllOnSheet(@Param("sheetId") Long sheetId);

    /** Rows of [sheetId (Long), entry count (Long)] for every sheet with at least one entry. */
    @Query(
            """
            select p.sheet.sheetId, count(p) from AvailabilityParticipant p
            group by p.sheet.sheetId
            """)
    List<Object[]> countEntriesPerSheet();

    /** Ids of the sheets an officer has already filled in. */
    @Query("select p.sheet.sheetId from AvailabilityParticipant p where p.user.uid = :uid")
    List<Long> findSheetIdsAnsweredBy(@Param("uid") String uid);
}
