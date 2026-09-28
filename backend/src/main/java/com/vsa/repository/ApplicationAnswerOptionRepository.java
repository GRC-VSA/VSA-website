package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationAnswerOption;
import com.vsa.model.ApplicationAnswerOption.ApplicationAnswerOptionId;

public interface ApplicationAnswerOptionRepository
        extends JpaRepository<ApplicationAnswerOption, ApplicationAnswerOptionId> {

    List<ApplicationAnswerOption> findByAnswerAnswerId(Long answerId);
}