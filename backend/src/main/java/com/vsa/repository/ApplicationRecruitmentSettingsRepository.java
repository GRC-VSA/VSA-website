package com.vsa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationRecruitmentSettings;

public interface ApplicationRecruitmentSettingsRepository
        extends JpaRepository<ApplicationRecruitmentSettings, Long> {
}