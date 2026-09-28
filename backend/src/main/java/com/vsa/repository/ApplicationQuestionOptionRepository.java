package com.vsa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationQuestionOption;

public interface ApplicationQuestionOptionRepository
        extends JpaRepository<ApplicationQuestionOption, Long> {

    List<ApplicationQuestionOption> findByQuestionQuestionIdOrderByDisplayOrderAsc(Long questionId);
}