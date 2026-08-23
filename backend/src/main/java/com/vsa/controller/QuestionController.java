package com.vsa.controller;

import com.vsa.dto.QuestionRequest;
import com.vsa.model.Question;
import com.vsa.service.QuestionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/questions")
public class QuestionController {
    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<List<Question>> getQuestions(@PathVariable Long eventId){
        return ResponseEntity.ok(questionService.getQuestionsForEvent(eventId));
    }

    @PostMapping
    public ResponseEntity<List<Question>> createQuestions(@PathVariable Long eventId, @RequestBody List<QuestionRequest> requests){
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestions(eventId, requests));
    }

    @PutMapping("/{questionId}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long eventId, @PathVariable Long questionId, @RequestBody QuestionRequest request){
        return ResponseEntity.ok(questionService.updateQuestion(eventId,questionId,request));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long eventId, @PathVariable Long questionId){
        questionService.deleteQuestion(eventId, questionId);
        return ResponseEntity.noContent().build();
    }
}
