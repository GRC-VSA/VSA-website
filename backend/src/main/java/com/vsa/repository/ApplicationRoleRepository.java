package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationRole;

public interface ApplicationRoleRepository
        extends JpaRepository<ApplicationRole, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<ApplicationRole> findAllByOrderByCreatedAtAsc();

    List<ApplicationRole> findByRecruitingTrueOrderByCreatedAtAsc();
}