package com.vsa.dto.request;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountVerificationRequest {

    private UUID verificationId;

    private String code;
}
