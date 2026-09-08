package com.vsa.repository;

import com.vsa.model.Applicant;
import com.vsa.model.ApplicantStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
  boolean existsByUserEmailAndApplicationRoleApplicationRoleId(String email, Long roleId);

  boolean existsByApplicationRoleApplicationRoleId(Long roleId);

  List<Applicant> findByUserEmailOrderBySubmittedAtDesc(String email);

  Optional<Applicant> findByApplicantIdAndUserEmail(Long applicantId, String email);

  List<Applicant> findAllByOrderBySubmittedAtDesc();

  List<Applicant> findByStatusOrderBySubmittedAtDesc(ApplicantStatus status);
}
