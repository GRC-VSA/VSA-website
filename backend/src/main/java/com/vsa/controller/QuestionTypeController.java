package com.vsa.controller;

import com.vsa.model.QuestionType;
import com.vsa.service.QuestionTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/question-types")
public class QuestionTypeController {
    private final QuestionTypeService questionTypeService;

    public QuestionTypeController(QuestionTypeService questionTypeService) {
        this.questionTypeService = questionTypeService;
    }

    @GetMapping
    public ResponseEntity<List<QuestionType>> getQuestionTypes(){
        return ResponseEntity.ok(questionTypeService.getAllQuestionTypes());
    }
}
