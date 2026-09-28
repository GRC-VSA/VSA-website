package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.Sponsor;

public interface SponsorRepository extends JpaRepository<Sponsor, Integer> {

    List<Sponsor> findAllByOrderBySponsorIdAsc();
}