package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.OurTeam;

public interface OurTeamRepository extends JpaRepository<OurTeam, Long> {

    List<OurTeam> findByGenerationOrderByOfficerNameAsc(Integer generation);

    List<OurTeam> findAllByOrderByGenerationDescOfficerNameAsc();
}