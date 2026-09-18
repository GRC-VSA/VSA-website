package com.vsa.service;

import com.vsa.dto.request.RegistrationResendRequest;
import com.vsa.dto.request.RegistrationVerificationRequest;
import com.vsa.model.Event;
import com.vsa.model.Registration;
import com.vsa.repository.QuestionRepository;
import com.vsa.repository.RegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RegistrationServiceOutboxTest {

    private RegistrationRepository registrationRepository;
    private QuestionRepository questionRepository;
    private EventService eventService;
    private EmailOutboxService emailOutboxService;
    private BCryptPasswordEncoder passwordEncoder;

    private RegistrationService registrationService;

    @BeforeEach
    void setUp() {
        registrationRepository = mock(RegistrationRepository.class);
        questionRepository = mock(QuestionRepository.class);
        eventService = mock(EventService.class);
        emailOutboxService = mock(EmailOutboxService.class);
        passwordEncoder = mock(BCryptPasswordEncoder.class);

        registrationService =
                new RegistrationService(
                        registrationRepository,
                        questionRepository,
                        eventService,
                        emailOutboxService,
                        passwordEncoder
                );
    }

    @Test
    void verifyRegistration_success_confirmsRegistrationAndQueuesConfirmationEmail() {

        UUID verificationId = UUID.randomUUID();

        Event event = createEvent();

        Registration registration = new Registration();
        registration.setRegistrationId(50L);
        registration.setEvent(event);
        registration.setStudentEmail("student@uw.edu");
        registration.setStatus("pending_email_verification");
        registration.setVerificationId(verificationId);
        registration.setVerificationCodeHash("hashed-code");
        registration.setVerificationExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );
        registration.setVerificationAttempts(0);

        RegistrationVerificationRequest request =
                new RegistrationVerificationRequest();

        request.setVerificationId(verificationId);
        request.setCode("ABCDEFG2");

        when(registrationRepository.findByVerificationId(verificationId))
                .thenReturn(Optional.of(registration));

        when(passwordEncoder.matches(
                "ABCDEFG2",
                "hashed-code"
        )).thenReturn(true);

        when(registrationRepository.countByEvent_EventIdAndStatus(
                25L,
                "confirmed"
        )).thenReturn(5L);

        when(registrationRepository.save(any(Registration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        registrationService.verifyRegistration(
                25L,
                request
        );

        assertEquals(
                "confirmed",
                registration.getStatus()
        );

        assertNotNull(
                registration.getEmailVerifiedAt()
        );

        assertNull(
                registration.getVerificationCodeHash()
        );

        assertNull(
                registration.getVerificationExpiresAt()
        );

        verify(emailOutboxService)
                .queueRegistrationConfirmationEmail(
                        50L,
                        "student@uw.edu",
                        "there",
                        "VSA Welcome Night",
                        "September 20, 2026",
                        "6:00 PM",
                        "UW Tacoma"
                );
    }

    @Test
    void verifyRegistration_wrongCode_incrementsAttemptsAndDoesNotQueueConfirmation() {

        UUID verificationId = UUID.randomUUID();

        Event event = createEvent();

        Registration registration = new Registration();
        registration.setRegistrationId(50L);
        registration.setEvent(event);
        registration.setStudentEmail("student@uw.edu");
        registration.setStatus("pending_email_verification");
        registration.setVerificationId(verificationId);
        registration.setVerificationCodeHash("hashed-code");
        registration.setVerificationExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );
        registration.setVerificationAttempts(2);

        RegistrationVerificationRequest request =
                new RegistrationVerificationRequest();

        request.setVerificationId(verificationId);
        request.setCode("ABCDEFG2");

        when(registrationRepository.findByVerificationId(verificationId))
                .thenReturn(Optional.of(registration));

        when(passwordEncoder.matches(
                "ABCDEFG2",
                "hashed-code"
        )).thenReturn(false);

        assertThrows(
                IllegalStateException.class,
                () -> registrationService.verifyRegistration(
                        25L,
                        request
                )
        );

        assertEquals(
                3,
                registration.getVerificationAttempts()
        );

        verify(registrationRepository)
                .save(registration);

        verify(
                emailOutboxService,
                never()
        ).queueRegistrationConfirmationEmail(
                anyLong(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        );
    }

    @Test
    void resendVerificationCode_savesNewCodeAndQueuesVerificationEmail() {

        UUID verificationId = UUID.randomUUID();

        Event event = createEvent();

        Registration registration = new Registration();
        registration.setRegistrationId(50L);
        registration.setEvent(event);
        registration.setStudentEmail("student@uw.edu");
        registration.setStatus("pending_email_verification");
        registration.setVerificationId(verificationId);

        /*
         * Old enough that the 60-second resend cooldown has passed.
         */
        registration.setVerificationCodeSentAt(
                LocalDateTime.now().minusMinutes(2)
        );

        registration.setVerificationAttempts(3);

        RegistrationResendRequest request =
                new RegistrationResendRequest();

        request.setVerificationId(verificationId);

        when(registrationRepository.findByVerificationId(verificationId))
                .thenReturn(Optional.of(registration));

        when(passwordEncoder.encode(anyString()))
                .thenReturn("new-hashed-code");

        when(registrationRepository.save(any(Registration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        registrationService.resendVerificationCode(
                25L,
                request
        );

        assertEquals(
                "new-hashed-code",
                registration.getVerificationCodeHash()
        );

        assertEquals(
                0,
                registration.getVerificationAttempts()
        );

        assertNotNull(
                registration.getVerificationCodeSentAt()
        );

        assertNotNull(
                registration.getVerificationExpiresAt()
        );

        verify(emailOutboxService)
                .queueRegistrationVerificationEmail(
                        eq(50L),
                        eq("student@uw.edu"),
                        eq("VSA Welcome Night"),
                        anyString()
                );
    }

    private Event createEvent() {
        Event event = new Event();

        event.setEventId(25L);
        event.setEventName("VSA Welcome Night");
        event.setCapacity(100);
        event.setEventDate(
                LocalDate.of(2026, 9, 20)
        );
        event.setStartTime(
                LocalTime.of(18, 0)
        );
        event.setLocation("UW Tacoma");

        return event;
    }
}