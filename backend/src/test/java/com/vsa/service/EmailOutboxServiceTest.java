package com.vsa.service;

import com.vsa.model.EmailOutbox;
import com.vsa.repository.EmailOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailOutboxServiceTest {

    private EmailOutboxRepository emailOutboxRepository;
    private EmailOutboxService emailOutboxService;

    @BeforeEach
    void setUp() {
        emailOutboxRepository = mock(EmailOutboxRepository.class);

        ObjectMapper objectMapper = new ObjectMapper();

        emailOutboxService =
                new EmailOutboxService(
                        emailOutboxRepository,
                        objectMapper
                );
    }

    @Test
    void queueRegistrationVerificationEmail_replacesOldPendingEmailAndQueuesNewOne() {

        emailOutboxService.queueRegistrationVerificationEmail(
                25L,
                "student@uw.edu",
                "VSA Welcome Night",
                "ABCDEFG2"
        );

        /*
         * The previous unsent verification email for this
         * registration should be removed first.
         */
        verify(emailOutboxRepository)
                .deleteByRegistrationIdAndEmailTypeAndStatus(
                        25L,
                        EmailOutbox.EmailType.REGISTRATION_VERIFICATION,
                        EmailOutbox.Status.PENDING
                );

        /*
         * Capture the new EmailOutbox object that the service saves.
         */
        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox savedOutbox = captor.getValue();

        assertEquals(
                25L,
                savedOutbox.getRegistrationId()
        );

        assertEquals(
                "student@uw.edu",
                savedOutbox.getRecipientEmail()
        );

        assertEquals(
                EmailOutbox.EmailType.REGISTRATION_VERIFICATION,
                savedOutbox.getEmailType()
        );

        assertEquals(
                EmailOutbox.Status.PENDING,
                savedOutbox.getStatus()
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("VSA Welcome Night")
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("ABCDEFG2")
        );
    }

    @Test
    void queueRegistrationConfirmationEmail_queuesConfirmationEmail() {

        emailOutboxService.queueRegistrationConfirmationEmail(
                25L,
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

        EmailOutbox savedOutbox = captor.getValue();

        assertEquals(
                25L,
                savedOutbox.getRegistrationId()
        );

        assertEquals(
                "student@uw.edu",
                savedOutbox.getRecipientEmail()
        );

        assertEquals(
                EmailOutbox.EmailType.REGISTRATION_CONFIRMATION,
                savedOutbox.getEmailType()
        );

        assertEquals(
                EmailOutbox.Status.PENDING,
                savedOutbox.getStatus()
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("VSA Welcome Night")
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("UW Tacoma")
        );

        /*
         * Confirmation emails must not delete pending
         * verification records themselves.
         */
        verify(
                emailOutboxRepository,
                never()
        ).deleteByRegistrationIdAndEmailTypeAndStatus(
                anyLong(),
                any(),
                any()
        );
    }

    @Test
    void queueAccountVerificationEmail_replacesOldPendingEmailAndQueuesNewOne() {

        emailOutboxService.queueAccountVerificationEmail(
                "user-uid-1",
                "student@uw.edu",
                "John",
                "ABCDEFG2"
        );

        /*
         * A newly issued code makes any still-unsent code email
         * for that account obsolete.
         */
        verify(emailOutboxRepository)
                .deleteByUserUidAndEmailTypeAndStatus(
                        "user-uid-1",
                        EmailOutbox.EmailType.ACCOUNT_VERIFICATION,
                        EmailOutbox.Status.PENDING
                );

        ArgumentCaptor<EmailOutbox> captor =
                ArgumentCaptor.forClass(EmailOutbox.class);

        verify(emailOutboxRepository).save(captor.capture());

        EmailOutbox savedOutbox = captor.getValue();

        assertEquals(
                "user-uid-1",
                savedOutbox.getUserUid()
        );

        /*
         * Account verification is not tied to an event registration.
         */
        assertNull(savedOutbox.getRegistrationId());

        assertEquals(
                "student@uw.edu",
                savedOutbox.getRecipientEmail()
        );

        assertEquals(
                EmailOutbox.EmailType.ACCOUNT_VERIFICATION,
                savedOutbox.getEmailType()
        );

        assertEquals(
                EmailOutbox.Status.PENDING,
                savedOutbox.getStatus()
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("John")
        );

        assertTrue(
                savedOutbox.getPayload()
                        .contains("ABCDEFG2")
        );
    }
}
