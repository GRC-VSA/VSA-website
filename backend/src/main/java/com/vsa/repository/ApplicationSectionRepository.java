package com.vsa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationSection;

public interface ApplicationSectionRepository
        extends JpaRepository<ApplicationSection, Long> {

    Optional<ApplicationSection> findBySystemKey(String systemKey);
}