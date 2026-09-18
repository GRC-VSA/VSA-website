package com.vsa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vsa.model.ApplicationAnswer;

public interface ApplicationAnswerRepository
        extends JpaRepository<ApplicationAnswer, Long> {

    List<ApplicationAnswer> findByApplicationApplicationId(Integer applicationId);

    Optional<ApplicationAnswer> findByApplicationApplicationIdAndQuestionQuestionId(Integer applicationId, Long questionId);

    boolean existsByQuestionQuestionId(Long questionId);

    void deleteByApplicationApplicationId(Integer applicationId);
}
