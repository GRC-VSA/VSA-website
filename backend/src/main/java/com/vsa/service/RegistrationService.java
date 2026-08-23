package com.vsa.service;

import com.vsa.dto.request.RegistrationRequest;
import com.vsa.model.Event;
import com.vsa.model.Registration;
import com.vsa.repository.QuestionRepository;
import com.vsa.repository.RegistrationRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class RegistrationService {
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private final RegistrationRepository registrationRepository;
    private final QuestionRepository questionRepository;
    private final EmailService emailService;
    private final EventService eventService;


    public RegistrationService(RegistrationRepository registrationRepository, QuestionRepository questionRepository, EmailService emailService, EventService eventService) {
        this.registrationRepository = registrationRepository;
        this.questionRepository = questionRepository;
        this.emailService = emailService;
        this.eventService = eventService;
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

        if (registrationRepository.existsByEvent_EventIdAndEmailIgnoreCase(eventId, req.getEmail())) {
            throw new IllegalStateException("This email has already registered for this event");
        }


    }
}
