package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationSectionRole;
import com.vsa.model.ApplicationSectionRole.ApplicationSectionRoleId;

public interface ApplicationSectionRoleRepository
        extends JpaRepository<ApplicationSectionRole, ApplicationSectionRoleId> {

    List<ApplicationSectionRole> findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(Long applicationRoleId);

    List<ApplicationSectionRole> findBySectionSectionId(Long sectionId);

    boolean existsByApplicationRoleApplicationRoleIdAndSectionSectionId(Long applicationRoleId, Long sectionId);
}