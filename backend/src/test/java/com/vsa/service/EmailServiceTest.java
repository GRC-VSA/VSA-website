package com.vsa.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private JavaMailSender javaMailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(javaMailSender);
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@vsa.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:3000");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendVerificationEmail_TriggersMailSender() {
        emailService.sendVerificationEmail("user@vsa.com", "John", "token123");
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendEventRegistrationEmail_TriggersMailSender() {
        emailService.sendEventRegistrationEmail(
                "user@vsa.com", "John", "Lunar New Year", "2026-02-15", "18:00", "Student Center");
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendOfficerApplicationEmail_TriggersMailSender() {
        emailService.sendOfficerApplicationEmail("user@vsa.com", "John", "Treasurer");
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetEmail_TriggersMailSender() {
        emailService.sendPasswordResetEmail("user@vsa.com", "John", "resetToken123");
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendEmail_Failure_ThrowsRuntimeException() {
        doThrow(new RuntimeException("Mail server down"))
                .when(javaMailSender)
                .send(any(MimeMessage.class));

        assertThrows(
                RuntimeException.class,
                () -> emailService.sendVerificationEmail("user@vsa.com", "John", "token123"));
    }
}