package com.vsa.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class AccountVerificationStartResponse {
    private UUID verificationId;

    private String maskedEmail;

    private LocalDateTime expiresAt;
}
