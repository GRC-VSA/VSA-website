package com.vsa.service;

import com.vsa.model.QuestionType;
import com.vsa.repository.QuestionTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionTypeService {
    private final QuestionTypeRepository questionTypeRepository;

    public QuestionTypeService(QuestionTypeRepository questionTypeRepository) {
        this.questionTypeRepository = questionTypeRepository;
    }

    public List<QuestionType> getAllQuestionTypes(){
        return questionTypeRepository.findAll();
    }
}
