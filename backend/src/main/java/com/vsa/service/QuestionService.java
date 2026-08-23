package com.vsa.service;

import com.vsa.dto.QuestionRequest;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Event;
import com.vsa.model.Question;
import com.vsa.model.QuestionType;
import com.vsa.repository.QuestionRepository;
import com.vsa.repository.QuestionTypeRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {
    private final QuestionTypeRepository questionTypeRepository;
    private final QuestionRepository questionRepository;
    private final EventService eventService;


    public QuestionService(QuestionTypeRepository questionTypeRepository, QuestionRepository questionRepository, EventService eventService) {
        this.questionTypeRepository = questionTypeRepository;
        this.questionRepository = questionRepository;
        this.eventService = eventService;
    }

    //READ Operations
    public List<Question> getQuestionsForEvent(Long eventId) {
        eventService.getEventById(eventId);
        return questionRepository.findByEventId_EventIdOrderByDisplayOrderAsc(eventId);
    }

    //CREATE Operations
    @Transactional
    public List<Question> createQuestions(Long eventId, List<QuestionRequest> requests) {
        Event event = eventService.getEventById(eventId);

        List<Question> questions =
                requests.stream()
                        .map(req -> buildQuestion(new Question(), event, req))
                        .collect(Collectors.toList());

        return questionRepository.saveAll(questions);
    }

    //UPDATE Operations
    @Transactional
    public Question updateQuestion(Long eventId, Long questionId, QuestionRequest req) {
        Question existing = getQuestionForEventOrThrow(eventId, questionId);
        return questionRepository.save(buildQuestion(existing, existing.getEvent(), req));
    }

    @Transactional
    public void deleteQuestion(Long eventId, Long questionId) {
        Question existing = getQuestionForEventOrThrow(eventId, questionId);
        questionRepository.delete(existing);
    }

    //Helpers
    private Question getQuestionForEventOrThrow(Long eventId, Long questionId) {
        Question question =
                questionRepository
                        .findById(questionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));

        if (!question.getEvent().getEventId().equals(eventId)) {
            throw new ResourceNotFoundException("Question", questionId);
        }
        return question;
    }

    private Question buildQuestion(Question question, Event event, QuestionRequest req) {
        QuestionType questionType = questionTypeRepository.findById(req.getQuestionTypeId()).orElseThrow(() -> new ResourceNotFoundException("QuestionType", req.getQuestionTypeId()));

        question.setEvent(event);
        question.setQuestionType(questionType);
        question.setQuestionText(req.getQuestionText());
        question.setRequired(question.isRequired());
        question.setDisplayOrder(req.getDisplayOrder());
        return question;
    }
}

