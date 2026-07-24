package com.vsa.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service class for sending HTML emails to users.
 *
 * <p>Manages all email communications including verification emails, event registration
 * confirmations, officer applications, and password reset emails. Uses HTML templates with VSA
 * branding and brand colors/fonts.
 *
 * @author VSA Development Team
 */
@Service
public class EmailService {
  // ── Brand Constants ────────────────────────────────────────
  private static final String PRIMARY_COLOR = "#ab3130";
  private static final String ACCENT_COLOR = "#ece0a6";
  private static final String TEXT_DARK = "#000000";
  private static final String TEXT_LIGHT = "#ffffff";
  private static final String TEXT_MUTED = "#666666";
  private static final String FONT_FAMILY = "'Poppins', Arial, sans-serif";

  // ── Dependencies ──────────────────────────────────────────
  private final JavaMailSender javaMailSender;

  /** Sender's email address from application configuration */
  @Value("${spring.mail.username}")
  private String fromEmail;

  /** Frontend base URL (configured in application.yaml as frontend.url) */
  @Value("${frontend.url}")
  private String frontendUrl;

  /**
   * Constructs an EmailService with required dependencies.
   *
   * @param javaMailSender Spring's mail sender for sending emails
   */
  public EmailService(JavaMailSender javaMailSender) {
    this.javaMailSender = javaMailSender;
  }

  // ── Verification Emails ────────────────────────────────────

  /**
   * Sends email verification email after user registration.
   *
   * <p>Contains a verification link that the user must click to verify their email address.
   *
   * @param toEmail Recipient's email address
   * @param firstName Recipient's first name
   * @param token Verification token to be used in the verification link
   */
  public void sendVerificationEmail(String toEmail, String firstName, String token) {
    String verifyUrl = buildFrontendUrl("/verify?token=" + token);

    String body =
        """
            %s
            <div style="background-color: %s; padding: 24px 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: %s; margin: 0 0 12px 0; font-weight: 600;">Welcome, %s!</h3>
                <p style="color: %s; margin: 0 0 20px 0; line-height: 1.6;">Thank you for joining the GRC Vietnamese Student Association! Please verify your email to complete your registration and unlock all features.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="%s" style="
                        display: inline-block;
                        background-color: %s;
                        color: %s;
                        padding: 14px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                        transition: background-color 0.2s;
                    ">Verify My Email</a>
                </div>
                <p style="color: %s; font-size: 13px; margin: 0;">This link will expire in 24 hours.</p>
            </div>
            """
            .formatted(
                getEmailHeader("Welcome to VSA!"),
                ACCENT_COLOR,
                PRIMARY_COLOR,
                firstName,
                TEXT_DARK,
                verifyUrl,
                PRIMARY_COLOR,
                TEXT_LIGHT,
                TEXT_MUTED);

    sendEmail(toEmail, "VSA - Verify Your Email", body);
  }

  // ── Event Registration Emails ──────────────────────────────

  /**
   * Sends event registration confirmation email to a user.
   *
   * <p>Includes event details such as date, time, and location.
   *
   * @param toEmail Recipient's email address
   * @param firstName Recipient's first name
   * @param eventName Name of the registered event
   * @param eventDate Date of the event
   * @param startTime Start time of the event
   * @param location Location of the event
   */
  public void sendEventRegistrationEmail(
      String toEmail,
      String firstName,
      String eventName,
      String eventDate,
      String startTime,
      String location) {
    String body =
        """
            %s
            <div style="background-color: %s; padding: 24px 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: %s; margin: 0 0 16px 0; font-weight: 600;">Hi %s, You're Registered!</h3>
                <p style="color: %s; margin: 0 0 20px 0; line-height: 1.6;">Your spot has been secured for the upcoming event. Here are the details:</p>

                <div style="
                    background-color: %s;
                    border-left: 5px solid %s;
                    padding: 18px 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                ">
                    <h4 style="color: %s; margin: 0 0 14px 0; font-weight: 600; font-size: 16px;">%s</h4>
                    <div style="color: %s; font-size: 14px; line-height: 1.8;">
                        <p style="margin: 6px 0;"><strong>📅 Date:</strong> %s</p>
                        <p style="margin: 6px 0;"><strong>⏰ Time:</strong> %s</p>
                        <p style="margin: 6px 0;"><strong>📍 Location:</strong> %s</p>
                    </div>
                </div>

                <p style="color: %s; margin: 0 0 8px 0; line-height: 1.6;">We're excited to see you there! If you need to make any changes to your registration, please contact us as soon as possible.</p>
            </div>
            """
            .formatted(
                getEmailHeader("Event Registration Confirmed"),
                ACCENT_COLOR,
                PRIMARY_COLOR,
                firstName,
                TEXT_DARK,
                "#fafafa",
                PRIMARY_COLOR,
                PRIMARY_COLOR,
                eventName,
                TEXT_DARK,
                eventDate,
                startTime,
                location,
                TEXT_MUTED);

    sendEmail(toEmail, "VSA - Event Registration Confirmed: " + eventName, body);
  }

  // ── Officer Application Emails ────────────────────────────

  /**
   * Sends officer application confirmation email.
   *
   * <p>Acknowledges receipt of the officer position application.
   *
   * @param toEmail Recipient's email address
   * @param firstName Recipient's first name
   * @param positionRole The officer position applied for
   */
  public void sendOfficerApplicationEmail(String toEmail, String firstName, String positionRole) {
    String body =
        """
            %s
            <div style="background-color: %s; padding: 24px 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: %s; margin: 0 0 16px 0; font-weight: 600;">Thanks for Applying, %s!</h3>
                <p style="color: %s; margin: 0 0 20px 0; line-height: 1.6;">Thank you for your interest in joining the VSA Officer Board. We're thrilled by your enthusiasm and commitment!</p>

                <div style="
                    background-color: %s;
                    border-left: 5px solid %s;
                    padding: 18px 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                    text-align: center;
                ">
                    <p style="color: %s; margin: 0; font-size: 14px;"><strong>Applied Position</strong></p>
                    <p style="color: %s; margin: 8px 0 0 0; font-size: 18px; font-weight: 600;">%s</p>
                </div>

                <p style="color: %s; margin: 0 0 12px 0; line-height: 1.6;">Our team is currently reviewing all applications and we'll get back to you with updates soon. In the meantime, feel free to reach out if you have any questions about the role.</p>
            </div>
            """
            .formatted(
                getEmailHeader("Officer Application Received"),
                ACCENT_COLOR,
                PRIMARY_COLOR,
                firstName,
                TEXT_DARK,
                "#fafafa",
                PRIMARY_COLOR,
                TEXT_MUTED,
                PRIMARY_COLOR,
                positionRole,
                TEXT_MUTED);

    sendEmail(toEmail, "VSA - Officer Application Received: " + positionRole, body);
  }

  // ── Password Reset Emails ──────────────────────────────────

  /**
   * Sends password reset email with temporary reset link.
   *
   * <p>The reset link is valid for 30 minutes and contains a token for security.
   *
   * @param toEmail Recipient's email address
   * @param firstName Recipient's first name
   * @param token Password reset token to be used in the reset link
   */
  public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
    String resetUrl = buildFrontendUrl("/reset-password?token=" + token);

    String body =
        """
            %s
            <div style="background-color: %s; padding: 24px 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: %s; margin: 0 0 12px 0; font-weight: 600;">Hi %s, Reset Your Password</h3>
                <p style="color: %s; margin: 0 0 20px 0; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="%s" style="
                        display: inline-block;
                        background-color: %s;
                        color: %s;
                        padding: 14px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                        transition: background-color 0.2s;
                    ">Reset Password</a>
                </div>
                <div style="background-color: #ffe6e6; border-left: 4px solid %s; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: %s; margin: 0; font-size: 13px; font-weight: 500;">⏱️ This link expires in 30 minutes</p>
                </div>
                <p style="color: %s; font-size: 13px; margin: 0;">If you didn't request this reset, you can safely ignore this email.</p>
            </div>
            """
            .formatted(
                getEmailHeader("Password Reset Request"),
                ACCENT_COLOR,
                PRIMARY_COLOR,
                firstName,
                TEXT_DARK,
                resetUrl,
                PRIMARY_COLOR,
                TEXT_LIGHT,
                PRIMARY_COLOR,
                PRIMARY_COLOR,
                TEXT_MUTED);

    sendEmail(toEmail, "VSA - Reset Your Password", body);
  }

  // ── Core Email Sending Method ──────────────────────────────

  /**
   * Core method for sending HTML emails.
   *
   * <p>Handles the low-level MIME message creation and sending logic. All other email methods
   * should use this method.
   *
   * @param to Recipient's email address
   * @param subject Email subject line
   * @param htmlBody HTML content of the email
   * @throws RuntimeException If the email fails to send
   */
  private void sendEmail(String to, String subject, String htmlBody) {
    try {
      MimeMessage message = javaMailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromEmail);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);

      javaMailSender.send(message);
    } catch (MessagingException e) {
      throw new RuntimeException("Failed to send email: " + e.getMessage());
    }
  }

  // ── Email Template Helpers ─────────────────────────────────

  /**
   * Generates the header section of branded emails with logo and title.
   *
   * @param title The title to display in the header
   * @return HTML string for the email header
   */
  private String getEmailHeader(String title) {
    return """
        <div style="
            background: linear-gradient(135deg, %s 0%%, %s 100%%);
            padding: 32px 20px;
            border-radius: 12px 12px 0 0;
            text-align: center;
            margin: 0;
        ">
            <h1 style="
                color: %s;
                margin: 0;
                font-family: %s;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            ">Vietnamese Student Association</h1>
            <p style="
                color: %s;
                margin: 8px 0 0 0;
                font-family: %s;
                font-size: 14px;
                font-weight: 500;
                opacity: 0.95;
            ">%s</p>
        </div>
        """.formatted(PRIMARY_COLOR, "#8b2525", TEXT_LIGHT, FONT_FAMILY, ACCENT_COLOR, FONT_FAMILY, title);
  }

  /**
   * Builds a frontend URL by ensuring the base URL does not have a trailing slash and appending
   * the provided path (which should begin with '/').
   */
  private String buildFrontendUrl(String path) {
    if (frontendUrl == null || frontendUrl.isBlank()) {
      return path; // fallback, should not happen if property is set
    }
    String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    return base + (path.startsWith("/") ? path : ("/" + path));
  }
}
