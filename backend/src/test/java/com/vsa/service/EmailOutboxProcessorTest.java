package com.vsa.service;

import com.vsa.model.EmailOutbox;
import com.vsa.repository.EmailOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailOutboxProcessorTest {

    private EmailOutboxRepository emailOutboxRepository;
    private EmailService emailService;
    private EmailOutboxProcessor emailOutboxProcessor;

    @BeforeEach
    void setUp() {
        emailOutboxRepository = mock(EmailOutboxRepository.class);
        emailService = mock(EmailService.class);

        ObjectMapper objectMapper = new ObjectMapper();

        emailOutboxProcessor =
                new EmailOutboxProcessor(
                        emailOutboxRepository,
                        emailService,
                        objectMapper
                );
    }

    @Test
    void processPendingEmails_verificationEmailSuccess_marksSentAndScrubsCode() {

        EmailOutbox outbox = createVerificationOutbox(1L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                1L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        emailOutboxProcessor.processPendingEmails();

        verify(emailService).sendEventRegistrationVerificationEmail(
                "student@uw.edu",
                "VSA Welcome Night",
                "ABCDEFG2"
        );

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.SENT, saved.getStatus());
        assertNotNull(saved.getSentAt());
        assertNull(saved.getProcessingStartedAt());
        assertNull(saved.getLastError());

        /*
         * Verification codes should not remain stored in plaintext
         * after the email is successfully delivered.
         */
        assertEquals("{}", saved.getPayload());
    }

    @Test
    void processPendingEmails_confirmationEmailSuccess_marksSent() {

        EmailOutbox outbox = createConfirmationOutbox(2L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                2L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        emailOutboxProcessor.processPendingEmails();

        verify(emailService).sendEventRegistrationEmail(
                "student@uw.edu",
                "there",
                "VSA Welcome Night",
                "September 20, 2026",
                "6:00 PM",
                "UW Tacoma"
        );

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.SENT, saved.getStatus());
        assertNotNull(saved.getSentAt());
        assertNull(saved.getProcessingStartedAt());
        assertNull(saved.getLastError());

        /*
         * Confirmation payloads do not contain verification codes,
         * so they do not need to be scrubbed.
         */
        assertTrue(saved.getPayload().contains("VSA Welcome Night"));
    }

    @Test
    void processPendingEmails_accountVerificationSuccess_marksSentAndScrubsCode() {

        EmailOutbox outbox = createAccountVerificationOutbox(6L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                6L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        emailOutboxProcessor.processPendingEmails();

        /*
         * The signup code has to actually reach the mail service. If the
         * dispatch switch has no ACCOUNT_VERIFICATION case, the row is
         * silently marked SENT and no email is ever delivered.
         */
        verify(emailService).sendAccountVerificationCodeEmail(
                "student@uw.edu",
                "John",
                "ABCDEFG2"
        );

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.SENT, saved.getStatus());
        assertNotNull(saved.getSentAt());
        assertNull(saved.getProcessingStartedAt());
        assertNull(saved.getLastError());

        /*
         * Account codes are just as sensitive as event-registration codes,
         * so this payload gets scrubbed too.
         */
        assertEquals("{}", saved.getPayload());
    }

    @Test
    void processPendingEmails_accountVerificationSmtpFailure_returnsEmailToPending() {

        EmailOutbox outbox = createAccountVerificationOutbox(7L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                7L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailService)
                .sendAccountVerificationCodeEmail(
                        "student@uw.edu",
                        "John",
                        "ABCDEFG2"
                );

        emailOutboxProcessor.processPendingEmails();

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.PENDING, saved.getStatus());
        assertEquals(1, saved.getAttemptCount());
        assertEquals("SMTP unavailable", saved.getLastError());
        assertNull(saved.getSentAt());

        /*
         * The code must survive an undelivered attempt, otherwise the retry
         * would send an email with a code the user was never given.
         */
        assertTrue(saved.getPayload().contains("ABCDEFG2"));
    }

    @Test
    void processPendingEmails_temporarySmtpFailure_returnsEmailToPending() {

        EmailOutbox outbox = createVerificationOutbox(3L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                3L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailService)
                .sendEventRegistrationVerificationEmail(
                        "student@uw.edu",
                        "VSA Welcome Night",
                        "ABCDEFG2"
                );

        emailOutboxProcessor.processPendingEmails();

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.PENDING, saved.getStatus());
        assertEquals(1, saved.getAttemptCount());
        assertEquals("SMTP unavailable", saved.getLastError());
        assertNull(saved.getProcessingStartedAt());
        assertNull(saved.getSentAt());

        /*
         * The payload must remain because the processor still
         * needs the verification code on the next retry.
         */
        assertTrue(saved.getPayload().contains("ABCDEFG2"));
    }

    @Test
    void processPendingEmails_fifthFailure_marksEmailFailed() {

        /*
         * It has already failed four times.
         */
        EmailOutbox outbox = createVerificationOutbox(4L, 4);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        when(emailOutboxRepository.claimPendingEmail(
                4L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(1);

        doThrow(new RuntimeException("SMTP still unavailable"))
                .when(emailService)
                .sendEventRegistrationVerificationEmail(
                        "student@uw.edu",
                        "VSA Welcome Night",
                        "ABCDEFG2"
                );

        emailOutboxProcessor.processPendingEmails();

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox saved = captor.getValue();

        assertEquals(EmailOutbox.Status.FAILED, saved.getStatus());
        assertEquals(5, saved.getAttemptCount());
        assertEquals("SMTP still unavailable", saved.getLastError());
        assertNull(saved.getProcessingStartedAt());
    }

    @Test
    void processPendingEmails_whenAnotherWorkerAlreadyClaimed_doesNotSendEmail() {

        EmailOutbox outbox = createVerificationOutbox(5L, 0);

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of(outbox));

        /*
         * 0 means another backend instance claimed the row first.
         */
        when(emailOutboxRepository.claimPendingEmail(
                5L,
                EmailOutbox.Status.PENDING,
                EmailOutbox.Status.PROCESSING
        )).thenReturn(0);

        emailOutboxProcessor.processPendingEmails();

        verifyNoInteractions(emailService);

        verify(emailOutboxRepository, never())
                .save(any(EmailOutbox.class));
    }

    @Test
    void processPendingEmails_attemptsToRecoverStaleProcessingEmails() {

        when(emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                EmailOutbox.Status.PENDING
        )).thenReturn(List.of());

        emailOutboxProcessor.processPendingEmails();

        verify(emailOutboxRepository)
                .recoverStaleProcessingEmails(
                        eq(EmailOutbox.Status.PROCESSING),
                        eq(EmailOutbox.Status.PENDING),
                        any(LocalDateTime.class)
                );
    }

    private EmailOutbox createVerificationOutbox(
            Long outboxId,
            int attemptCount
    ) {
        EmailOutbox outbox = new EmailOutbox();

        outbox.setOutboxId(outboxId);
        outbox.setRegistrationId(25L);
        outbox.setEmailType(
                EmailOutbox.EmailType.REGISTRATION_VERIFICATION
        );
        outbox.setRecipientEmail("student@uw.edu");

        outbox.setPayload(
                """
                {
                  "eventName": "VSA Welcome Night",
                  "verificationCode": "ABCDEFG2"
                }
                """
        );

        outbox.setStatus(EmailOutbox.Status.PENDING);
        outbox.setAttemptCount(attemptCount);

        return outbox;
    }

    private EmailOutbox createAccountVerificationOutbox(
            Long outboxId,
            int attemptCount
    ) {
        EmailOutbox outbox = new EmailOutbox();

        outbox.setOutboxId(outboxId);
        outbox.setUserUid("user-uid-1");
        outbox.setEmailType(
                EmailOutbox.EmailType.ACCOUNT_VERIFICATION
        );
        outbox.setRecipientEmail("student@uw.edu");

        outbox.setPayload(
                """
                {
                  "firstName": "John",
                  "verificationCode": "ABCDEFG2"
                }
                """
        );

        outbox.setStatus(EmailOutbox.Status.PENDING);
        outbox.setAttemptCount(attemptCount);

        return outbox;
    }

    private EmailOutbox createConfirmationOutbox(
            Long outboxId,
            int attemptCount
    ) {
        EmailOutbox outbox = new EmailOutbox();

        outbox.setOutboxId(outboxId);
        outbox.setRegistrationId(25L);
        outbox.setEmailType(
                EmailOutbox.EmailType.REGISTRATION_CONFIRMATION
        );
        outbox.setRecipientEmail("student@uw.edu");

        outbox.setPayload(
                """
                {
                  "firstName": "there",
                  "eventName": "VSA Welcome Night",
                  "eventDate": "September 20, 2026",
                  "startTime": "6:00 PM",
                  "location": "UW Tacoma"
                }
                """
        );

        outbox.setStatus(EmailOutbox.Status.PENDING);
        outbox.setAttemptCount(attemptCount);

        return outbox;
    }
}