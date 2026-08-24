package com.vsa.repository;

import com.vsa.model.ApplicationRole;
import com.vsa.model.ApplicationRoleStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRoleRepository extends JpaRepository<ApplicationRole, Long> {
  boolean existsByNameIgnoreCase(String name);

  List<ApplicationRole> findAllByOrderByCreatedAtAsc();

  List<ApplicationRole> findByRecruitingTrueAndStatusOrderByCreatedAtAsc(ApplicationRoleStatus status);
}
