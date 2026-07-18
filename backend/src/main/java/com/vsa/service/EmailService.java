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
 * branding.
 *
 * @author VSA Development Team
 */
@Service
public class EmailService {
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #FFD700;">Welcome to GRC Vietnamese Student Association, %s!</h2>
                <p>Thank you for creating an account. Please verify your email to get started.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="
                        background-color: #FFD700;
                        color: black;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                    ">Verify My Email</a>
                </div>
                <p style="color: #888; font-size: 13px;">
                    If you did not create an account, you can safely ignore this email.
                </p>
                <hr/>
                <p style="color: #888; font-size: 12px;">GRC Vietnamese Student Association · Green River College</p>
            </div>
            """
            .formatted(firstName, verifyUrl);

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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #FFD700;">You're registered, %s!</h2>
                <p>Your spot has been confirmed for the following event:</p>

                <div style="
                    background-color: #f9f9f9;
                    border-left: 4px solid #FFD700;
                    padding: 15px 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                ">
                    <h3 style="margin: 0 0 10px 0;">%s</h3>
                    <p style="margin: 5px 0;">📅 <strong>Date:</strong> %s</p>
                    <p style="margin: 5px 0;">⏰ <strong>Time:</strong> %s</p>
                    <p style="margin: 5px 0;">📍 <strong>Location:</strong> %s</p>
                </div>

                <p>We look forward to seeing you there!</p>
                <p>If you need to cancel your registration, please contact us.</p>
                <hr/>
                <p style="color: #888; font-size: 12px;">GRC Vietnamese Student Association · Green River College</p>
            </div>
            """
            .formatted(firstName, eventName, eventDate, startTime, location);

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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #FFD700;">Application Received, %s!</h2>
                <p>Thank you for applying to join the VSA Officer Board. We have received your application for the following position:</p>

                <div style="
                    background-color: #f9f9f9;
                    border-left: 4px solid #FFD700;
                    padding: 15px 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                ">
                    <p style="margin: 0; font-size: 18px;"><strong>Position:</strong> %s</p>
                </div>

                <p>Our team will review your application and get back to you soon.</p>
                <p>In the meantime, feel free to reach out if you have any questions.</p>
                <hr/>
                <p style="color: #888; font-size: 12px;">GRC Vietnamese Student Association · Green River College</p>
            </div>
            """
            .formatted(firstName, positionRole);

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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #FFD700;">Password Reset Request</h2>
                <p>Hi %s, we received a request to reset your password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="
                        background-color: #FFD700;
                        color: black;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                    ">Reset Password</a>
                </div>
                <p style="color: #e74c3c;"><strong>This link expires in 30 minutes.</strong></p>
                <p style="color: #888; font-size: 13px;">
                    If you did not request a password reset, ignore this email.
                </p>
                <hr/>
                <p style="color: #888; font-size: 12px;">GRC Vietnamese Student Association · Green River College</p>
            </div>
            """
            .formatted(firstName, resetUrl);

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
