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
                EmailOutbox.EmailType.REGISTRATION_CONFIRMATION,
                recipientEmail,
                payload
        );
    }

    /**
     * Queues an email with a guest's new availability edit link.
     *
     * @param recipientEmail Guest's email
     * @param guestName Name the guest entered
     * @param sheetTitle Title of the availability sheet
     * @param editPath Frontend path (starting with '/') that opens the sheet in edit mode
     */
    public void queueAvailabilityEditLinkEmail(
            String recipientEmail,
            String guestName,
            String sheetTitle,
            String editPath
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("guestName", guestName);
        payload.put("sheetTitle", sheetTitle);
        payload.put("editPath", editPath);

        saveOutboxEntry(
                null,
                EmailOutbox.EmailType.AVAILABILITY_EDIT_LINK,
                recipientEmail,
                payload
        );
    }

    private void saveOutboxEntry(
            Long registrationId,
            EmailOutbox.EmailType emailType,
            String recipientEmail,
            Map<String, Object> payload
    ) {
        EmailOutbox outbox = new EmailOutbox();

        outbox.setRegistrationId(registrationId);
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