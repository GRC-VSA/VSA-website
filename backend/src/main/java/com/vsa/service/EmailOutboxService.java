package com.vsa.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import com.vsa.model.EmailOutbox;
import com.vsa.repository.EmailOutboxRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional
public class EmailOutboxService {

    private final EmailOutboxRepository emailOutboxRepository;
    private final ObjectMapper objectMapper;

    public EmailOutboxService(
            EmailOutboxRepository emailOutboxRepository,
            ObjectMapper objectMapper
    ) {
        this.emailOutboxRepository = emailOutboxRepository;
        this.objectMapper = objectMapper;
    }

    public void queueRegistrationVerificationEmail(
            Long registrationId,
            String recipientEmail,
            String eventName,
            String verificationCode
    ) {
        /*
         * A new verification code makes any older unsent
         * verification-code email for this registration useless.
         */
        emailOutboxRepository.deleteByRegistrationIdAndEmailTypeAndStatus(
                registrationId,
                EmailOutbox.EmailType.REGISTRATION_VERIFICATION,
                EmailOutbox.Status.PENDING
        );
        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("eventName", eventName);
        payload.put("verificationCode", verificationCode);

        saveOutboxEntry(
                registrationId,
                null,
                EmailOutbox.EmailType.REGISTRATION_VERIFICATION,
                recipientEmail,
                payload
        );
    }

    public void queueRegistrationConfirmationEmail(
            Long registrationId,
            String recipientEmail,
            String firstName,
            String eventName,
            String eventDate,
            String startTime,
            String location
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("firstName", firstName);
        payload.put("eventName", eventName);
        payload.put("eventDate", eventDate);
        payload.put("startTime", startTime);
        payload.put("location", location);

        saveOutboxEntry(
                registrationId,
                null,
                EmailOutbox.EmailType.REGISTRATION_CONFIRMATION,
                recipientEmail,
                payload
        );
    }

    /**
     * Queues the signup verification-code email for a user account.
     *
     * <p>Mirrors the registration equivalent: reissuing a code invalidates any
     * unsent email carrying the previous one, so a slow outbox can never deliver
     * a stale code after a newer one was requested.
     */
    public void queueAccountVerificationEmail(
            String userUid,
            String recipientEmail,
            String firstName,
            String verificationCode
    ) {
        emailOutboxRepository.deleteByUserUidAndEmailTypeAndStatus(
                userUid,
                EmailOutbox.EmailType.ACCOUNT_VERIFICATION,
                EmailOutbox.Status.PENDING
        );

        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("firstName", firstName);
        payload.put("verificationCode", verificationCode);

        saveOutboxEntry(
                null,
                userUid,
                EmailOutbox.EmailType.ACCOUNT_VERIFICATION,
                recipientEmail,
                payload
        );
    }

    /**
     * Queues the code confirming a change of account email.
     *
     * <p>recipientEmail is the NEW address, not the account's current one — that
     * address is exactly what the code is proving ownership of.
     */
    public void queueEmailChangeVerificationEmail(
            String userUid,
            String newEmail,
            String firstName,
            String verificationCode
    ) {
        emailOutboxRepository.deleteByUserUidAndEmailTypeAndStatus(
                userUid,
                EmailOutbox.EmailType.EMAIL_CHANGE_VERIFICATION,
                EmailOutbox.Status.PENDING
        );

        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("firstName", firstName);
        payload.put("verificationCode", verificationCode);

        saveOutboxEntry(
                null,
                userUid,
                EmailOutbox.EmailType.EMAIL_CHANGE_VERIFICATION,
                newEmail,
                payload
        );
    }

    private void saveOutboxEntry(
            Long registrationId,
            String userUid,
            EmailOutbox.EmailType emailType,
            String recipientEmail,
            Map<String, Object> payload
    ) {
        EmailOutbox outbox = new EmailOutbox();

        outbox.setRegistrationId(registrationId);
        outbox.setUserUid(userUid);
        outbox.setEmailType(emailType);
        outbox.setRecipientEmail(recipientEmail);
        outbox.setPayload(toJson(payload));
        outbox.setStatus(EmailOutbox.Status.PENDING);

        emailOutboxRepository.save(outbox);
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Failed to serialize email outbox payload.", ex);
        }
    }
}