package com.vsa.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

/**
 * Response returned after a guest submits an event registration form.
 *
 * <p>The registration is still pending until the student email
 * verification code is successfully verified.
 */
@Getter
@Setter
public class RegistrationStartResponse {

    /** Public identifier used by the verification page */
    private UUID verificationId;

    /** Masked student email showing where the code was sent */
    private String email;

    /** Time when the verification code expires */
    private LocalDateTime expiresAt;

    public RegistrationStartResponse(UUID verificationId, String email, LocalDateTime expiresAt) {
        this.verificationId = verificationId;
        this.email = email;
        this.expiresAt = expiresAt;
    }
}