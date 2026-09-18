package com.vsa.dto.request;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for verifying a pending event registration.
 */
@Getter
@Setter
public class RegistrationVerificationRequest {

    /** Verification session returned when the registration form was submitted */
    private UUID verificationId;

    /** Eight-character code sent to the student's email */
    private String code;
}