package com.vsa.repository;
import java.time.LocalDateTime;
import com.vsa.model.EmailOutbox;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long> {

    List<EmailOutbox> findByStatusOrderByCreatedAtAsc(EmailOutbox.Status status);

    void deleteByRegistrationIdAndEmailTypeAndStatus(
            Long registrationId,
            EmailOutbox.EmailType emailType,
            EmailOutbox.Status status
    );

    /*
     * Account-level equivalent of the delete above: a newly issued code makes
     * any still-unsent code email for that user obsolete.
     */
    void deleteByUserUidAndEmailTypeAndStatus(
            String userUid,
            EmailOutbox.EmailType emailType,
            EmailOutbox.Status status
    );

    @Transactional
    @Modifying
    @Query("""
        UPDATE EmailOutbox e
        SET e.status = :processingStatus,
            e.processingStartedAt = CURRENT_TIMESTAMP
        WHERE e.outboxId = :outboxId
          AND e.status = :pendingStatus
        """)
    int claimPendingEmail(
            @Param("outboxId") Long outboxId,
            @Param("pendingStatus") EmailOutbox.Status pendingStatus,
            @Param("processingStatus") EmailOutbox.Status processingStatus
    );

    @Transactional
    @Modifying
    @Query("""
        UPDATE EmailOutbox e
        SET e.status = :pendingStatus,
            e.processingStartedAt = null
        WHERE e.status = :processingStatus
          AND e.processingStartedAt IS NOT NULL
          AND e.processingStartedAt < :cutoff
        """)
    int recoverStaleProcessingEmails(
            @Param("processingStatus") EmailOutbox.Status processingStatus,
            @Param("pendingStatus") EmailOutbox.Status pendingStatus,
            @Param("cutoff") LocalDateTime cutoff
    );
}