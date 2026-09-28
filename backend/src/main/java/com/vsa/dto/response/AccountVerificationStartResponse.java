package com.vsa.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AccountVerificationStartResponse {
    private UUID verificationId;

    private String maskedEmail;

    private LocalDateTime expiresAt;
}
