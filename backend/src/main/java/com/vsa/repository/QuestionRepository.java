package com.vsa.repository;

import com.vsa.model.Question;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository {

    List<Question> findByEventId_EventIdOrderByDisplayOrderAsc(Long EventId);
}
