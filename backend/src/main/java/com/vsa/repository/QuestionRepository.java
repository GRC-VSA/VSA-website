package com.vsa.repository;

import com.vsa.model.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByEvent_EventIdOrderByDisplayOrderAsc(Long eventId);

    @EntityGraph(attributePaths = {"questionType", "options"})
    List<Question> findByEvent_EventIdAndIsActiveTrueOrderByDisplayOrderAsc(Long eventId);
}
