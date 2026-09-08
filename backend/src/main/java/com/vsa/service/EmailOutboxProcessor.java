package com.vsa.service;

import com.vsa.model.EmailOutbox;
import com.vsa.repository.EmailOutboxRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class EmailOutboxProcessor {

    private static final int MAX_ATTEMPTS = 5;
    private static final int PROCESSING_TIMEOUT_MINUTES = 5;
    private final EmailOutboxRepository emailOutboxRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public EmailOutboxProcessor(
            EmailOutboxRepository emailOutboxRepository,
            EmailService emailService,
            ObjectMapper objectMapper
    ) {
        this.emailOutboxRepository = emailOutboxRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 10000)
    public void processPendingEmails() {

        /*
        * If a backend instance crashed after claiming an email,
        * return that email to PENDING after the timeout.
        */
        LocalDateTime cutoff =
            LocalDateTime.now()
                    .minusMinutes(PROCESSING_TIMEOUT_MINUTES);

        emailOutboxRepository.recoverStaleProcessingEmails(
            EmailOutbox.Status.PROCESSING,
            EmailOutbox.Status.PENDING,
            cutoff
        );

        List<EmailOutbox> pendingEmails =
            emailOutboxRepository.findByStatusOrderByCreatedAtAsc(
                    EmailOutbox.Status.PENDING
            );

        for (EmailOutbox outbox : pendingEmails) {

            int claimed =
                emailOutboxRepository.claimPendingEmail(
                        outbox.getOutboxId(),
                        EmailOutbox.Status.PENDING,
                        EmailOutbox.Status.PROCESSING
                );

            /*
            * Another backend instance already claimed this email.
            */
            if (claimed == 0) {
                continue;
            }

            processEmail(outbox);
        }
    }

    private void processEmail(EmailOutbox outbox) {

        try {
            Map<String, Object> payload = objectMapper.readValue(
                outbox.getPayload(), 
                new TypeReference<Map<String, Object>>() {}
            );

            switch (outbox.getEmailType()) {

                case REGISTRATION_VERIFICATION -> sendRegistrationVerificationEmail(outbox, payload);

                case REGISTRATION_CONFIRMATION -> sendRegistrationConfirmationEmail(outbox, payload);
            }

            outbox.setStatus(EmailOutbox.Status.SENT);
            outbox.setSentAt(LocalDateTime.now());
            outbox.setProcessingStartedAt(null);
            outbox.setLastError(null);

            /*
             * Verification payload contains the plaintext code.
             * Once successfully delivered, we no longer need to keep it.
             */
            if (outbox.getEmailType() == EmailOutbox.EmailType.REGISTRATION_VERIFICATION) {
                outbox.setPayload("{}");
            }

        } catch (Exception ex) {

            int attempts = outbox.getAttemptCount() + 1;

            outbox.setAttemptCount(attempts);
            outbox.setLastError(getErrorMessage(ex));

            /*
            * This processing attempt is over.
            */
            outbox.setProcessingStartedAt(null);
            
            if (attempts >= MAX_ATTEMPTS) {
                outbox.setStatus(EmailOutbox.Status.FAILED);
            }
            else {
                /*
                * SMTP failed, so make the email available
                * for another retry on the next processor cycle.
                */
                outbox.setStatus(EmailOutbox.Status.PENDING);
            }
        }

        emailOutboxRepository.save(outbox);
    }

    private void sendRegistrationVerificationEmail(EmailOutbox outbox, Map<String, Object> payload) {

        emailService.sendEventRegistrationVerificationEmail(
                outbox.getRecipientEmail(),
                (String) payload.get("eventName"),
                (String) payload.get("verificationCode")
        );
    }

    private void sendRegistrationConfirmationEmail(EmailOutbox outbox, Map<String, Object> payload) {

        emailService.sendEventRegistrationEmail(
                outbox.getRecipientEmail(),
                (String) payload.get("firstName"),
                (String) payload.get("eventName"),
                (String) payload.get("eventDate"),
                (String) payload.get("startTime"),
                (String) payload.get("location")
        );
    }

    private void sendAccountVerificationEmail(EmailOutbox outbox, Map<String, Object> payload){
        emailService.sendAccountVerificationCodeEmail(outbox.getRecipientEmail(), (String) payload.get("firstName"), (String) payload.get("verificationCode"));
    }

    private String getErrorMessage(Exception ex) {

        String message = ex.getMessage();

        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }

        /*
         * Prevent an enormous SMTP error message from being stored.
         */
        return message.length() > 2000 ? message.substring(0, 2000) : message;
    }
}