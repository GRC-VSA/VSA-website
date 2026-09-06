package com.vsa.service;

import com.vsa.dto.request.QuestionRequest;
import com.vsa.dto.request.QuestionOptionRequest;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Event;
import com.vsa.model.Question;
import com.vsa.model.QuestionOption;
import com.vsa.model.QuestionType;
import com.vsa.repository.QuestionRepository;
import com.vsa.repository.QuestionTypeRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private static final String STUDENT_EMAIL_SYSTEM_KEY = "STUDENT_EMAIL";

    private final QuestionTypeRepository questionTypeRepository;
    private final QuestionRepository questionRepository;
    private final EventService eventService;


    public QuestionService(
            QuestionTypeRepository questionTypeRepository,
            QuestionRepository questionRepository,
            EventService eventService
    ) {
        this.questionTypeRepository = questionTypeRepository;
        this.questionRepository = questionRepository;
        this.eventService = eventService;
    }


    // READ Operations

    public List<Question> getQuestionsForEvent(Long eventId) {
        eventService.getEventById(eventId);

        return questionRepository
                .findByEvent_EventIdOrderByDisplayOrderAsc(eventId);
    }


    // CREATE Operations

    @Transactional
    public List<Question> createQuestions(
            Long eventId,
            List<QuestionRequest> requests
    ) {
        Event event = eventService.getEventById(eventId);

        List<Question> questions = new ArrayList<>();


        // --------------------------------------------------------
        // Automatically create the required student-email question
        // --------------------------------------------------------

        boolean studentEmailQuestionExists =
                questionRepository.existsByEvent_EventIdAndSystemKey(
                        eventId,
                        STUDENT_EMAIL_SYSTEM_KEY
                );

        if (!studentEmailQuestionExists) {
            Question studentEmailQuestion =
                    buildStudentEmailQuestion(event);

            questions.add(studentEmailQuestion);
        }


        // --------------------------------------------------------
        // Create officer-defined questions
        //
        // Display order is shifted by 1 because the student-email
        // question always occupies display order 1.
        // --------------------------------------------------------

        List<Question> customQuestions =
                requests.stream()
                        .map(req -> {
                            Question question =
                                    buildQuestion(
                                            new Question(),
                                            event,
                                            req
                                    );

                            question.setDisplayOrder(
                                    req.getDisplayOrder() + 1
                            );

                            return question;
                        })
                        .collect(Collectors.toList());

        questions.addAll(customQuestions);

        return questionRepository.saveAll(questions);
    }


    // UPDATE Operations

    @Transactional
    public Question updateQuestion(Long eventId, Long questionId, QuestionRequest req) {
        Question existing =
                getQuestionForEventOrThrow(eventId, questionId);

        if (STUDENT_EMAIL_SYSTEM_KEY.equals(existing.getSystemKey())) {
            throw new IllegalStateException(
                    "The student email question cannot be modified."
            );
        }

        return questionRepository.save(
                buildQuestion(
                        existing,
                        existing.getEvent(),
                        req
                )
        );
    }


    // DELETE Operations

    @Transactional
    public void deleteQuestion(
            Long eventId,
            Long questionId
    ) {
        Question existing =
                getQuestionForEventOrThrow(eventId, questionId);

        if (STUDENT_EMAIL_SYSTEM_KEY.equals(existing.getSystemKey())) {
            throw new IllegalStateException("The student email question cannot be deleted.");
        }

        questionRepository.delete(existing);
    }


    // Helpers

    private Question buildStudentEmailQuestion(Event event) {

        QuestionType emailType =
                questionTypeRepository
                        .findByTypeName("email")
                        .orElseThrow(() ->new IllegalStateException("Question type 'email' was not found."));

        Question question = new Question();

        question.setEvent(event);
        question.setQuestionType(emailType);

        question.setQuestionText("What is your student email?");

        question.setSystemKey(
                STUDENT_EMAIL_SYSTEM_KEY
        );

        question.setRequired(true);
        question.setDisplayOrder(1);
        question.setActive(true);

        return question;
    }


    private Question getQuestionForEventOrThrow(
            Long eventId,
            Long questionId
    ) {
        Question question =
                questionRepository
                        .findById(questionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Question",
                                        questionId
                                )
                        );

        if (!question
                .getEvent()
                .getEventId()
                .equals(eventId)) {

            throw new ResourceNotFoundException(
                    "Question",
                    questionId
            );
        }

        return question;
    }


    private Question buildQuestion(
            Question question,
            Event event,
            QuestionRequest req
    ) {

        QuestionType questionType =
                questionTypeRepository
                        .findById(req.getQuestionTypeId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "QuestionType",
                                        req.getQuestionTypeId()
                                )
                        );

        question.setEvent(event);
        question.setQuestionType(questionType);
        question.setQuestionText(req.getQuestionText());


        question.setRequired(req.isRequired());

        question.setDisplayOrder(req.getDisplayOrder());


        if (req.getOptions() != null) {

            question.getOptions().clear();

            for (QuestionOptionRequest optionRequest :
                    req.getOptions()) {

                QuestionOption option =
                        new QuestionOption();

                option.setQuestion(question);

                option.setOptionText(
                        optionRequest.getOptionText()
                );

                option.setDisplayOrder(
                        optionRequest.getDisplayOrder()
                );

                question.getOptions().add(option);
            }
        }

        return question;
    }
}