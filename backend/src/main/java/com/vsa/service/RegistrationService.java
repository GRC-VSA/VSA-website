package com.vsa.service;

import com.vsa.dto.request.AnswerRequest;
import com.vsa.dto.request.RegistrationRequest;
import com.vsa.dto.response.QuestionOptionResponse;
import com.vsa.dto.response.RegistrationFormResponse;
import com.vsa.dto.response.RegistrationQuestionResponse;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.*;
import com.vsa.repository.QuestionRepository;
import com.vsa.repository.RegistrationRepository;
import com.vsa.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistrationService {
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private final RegistrationRepository registrationRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final EventService eventService;
    private final EmailService emailService;



    public RegistrationService(
            RegistrationRepository registrationRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository,
            EventService eventService,
            EmailService emailService) {
        this.registrationRepository = registrationRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.eventService = eventService;
        this.emailService = emailService;
    }


    //Read
    public List<Registration> getRegistrationsForEvent(Long eventId){
        eventService.getEventById(eventId);
        return registrationRepository.findByEvent_EventId(eventId);
}

    //Create
    @Transactional
    public Registration register(Long eventId, RegistrationRequest req) {
        Event event = eventService.getEventById(eventId);
        if (!"INTERNAL".equals(event.getRegistrationType())) {
            throw new IllegalStateException("This event does not use internal registration.");
        }
        User user = getCurrentUser();

        if (registrationRepository.existsByEvent_EventIdAndUser_Sid(eventId, user.getSid())) {
            throw new IllegalStateException("You have already registered for this event.");
        }

        long currentCount = registrationRepository.countByEvent_EventId(eventId);
        if (currentCount >= event.getCapacity()) {
            throw new IllegalStateException("This event is at capacity.");
        }

        Registration registration = new Registration();
        registration.setEvent(event);
        registration.setUser(user);
        registration.setTicketType(req.getTicketType() != null ? req.getTicketType() : "general");
        // status defaults to "confirmed" and quantity to 1 via the entity's own field defaults

        if (req.getAnswers() != null) {
            List<EventAnswer> answers =
                    req.getAnswers().stream()
                            .map(a -> buildAnswer(eventId, registration, a))
                            .collect(Collectors.toList());
            registration.setAnswers(answers);
        }

        Registration saved = registrationRepository.save(registration);

        emailService.sendEventRegistrationEmail(
                user.getEmail(),
                user.getFirstName(),
                event.getEventName(),
                event.getEventDate().format(DATE_FORMATTER),
                event.getStartTime().format(TIME_FORMATTER),
                event.getLocation());

        return saved;
    }

    @Transactional
    public RegistrationFormResponse getRegistrationForm(Long eventId) {

        Event event = eventService.getEventById(eventId);

        if (!"INTERNAL".equals(event.getRegistrationType())) {
            throw new IllegalStateException("This event does not use internal registration.");
        }

        List<Question> questions = questionRepository.findByEvent_EventIdAndIsActiveTrueOrderByDisplayOrderAsc(eventId);

        RegistrationFormResponse response = new RegistrationFormResponse();

        response.setEventId(event.getEventId());
        response.setEventName(event.getEventName());
        response.setTitle(event.getTitle());

        List<RegistrationQuestionResponse> questionResponses =
                                questions.stream()
                                .map(this::buildQuestionResponse)
                                .collect(Collectors.toList());

         response.setQuestions(questionResponses);

        return response;
}

    //Helper
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }

    private EventAnswer buildAnswer(Long eventId, Registration registration, AnswerRequest req) {
        Question question =
                questionRepository
                        .findById(req.getQuestionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Question", req.getQuestionId()));

        // Guard against submitting an answer for a question that belongs to a different event
        if (!question.getEvent().getEventId().equals(eventId)) {
            throw new ResourceNotFoundException("Question", req.getQuestionId());
        }

        EventAnswer answer = new EventAnswer();
        answer.setRegistration(registration);
        answer.setQuestion(question);
        answer.setAnswerValue(req.getAnswerText());
        return answer;
    }

    private RegistrationQuestionResponse buildQuestionResponse(Question question) {

        RegistrationQuestionResponse response = new RegistrationQuestionResponse();
        response.setQuestionId(question.getQuestionId());
        response.setQuestionText(question.getQuestionText());
        response.setRequired(question.isRequired());
        response.setDisplayOrder(question.getDisplayOrder());
        response.setQuestionTypeId(question.getQuestionType().getQuestionTypeId());
        response.setTypeName(question.getQuestionType().getTypeName());

        List<QuestionOptionResponse> optionResponses =
                            question.getOptions()
                            .stream()
                            .map(this::buildOptionResponse)
                            .collect(Collectors.toList());

        response.setOptions(optionResponses);
        return response;
    }

    private QuestionOptionResponse buildOptionResponse(QuestionOption option) {

        QuestionOptionResponse response = new QuestionOptionResponse();
        response.setOptionId(option.getOptionId());
        response.setOptionText(option.getOptionText());
        response.setDisplayOrder(option.getDisplayOrder());
        return response;
    }

}
