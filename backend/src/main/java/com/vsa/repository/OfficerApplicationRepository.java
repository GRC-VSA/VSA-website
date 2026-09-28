package com.vsa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vsa.model.OfficerApplication;
import com.vsa.model.OfficerApplicationStatus;

public interface OfficerApplicationRepository
        extends JpaRepository<OfficerApplication, Integer> {

    boolean existsByUserUidAndApplicationRoleApplicationRoleId(String uid, Long applicationRoleId);

    boolean existsByApplicationRoleApplicationRoleId(Long applicationRoleId);

    Optional<OfficerApplication> findByUserUidAndApplicationRoleApplicationRoleId(String uid, Long applicationRoleId);

    Optional<OfficerApplication> findByApplicationIdAndUserUid(Integer applicationId, String uid);

    List<OfficerApplication> findByUserUidOrderByUpdatedAtDesc(String uid);

    List<OfficerApplication> findAllByOrderByCreatedAtDesc();

    List<OfficerApplication> findByStatusOrderByCreatedAtDesc(OfficerApplicationStatus status);

    @Modifying
    @Query("""
            UPDATE OfficerApplication application
            SET application.currentSection = null
            WHERE application.currentSection.sectionId = :sectionId
            """)
    int clearCurrentSectionBySectionId(@Param("sectionId") Long sectionId);
}
