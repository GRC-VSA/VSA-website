package com.vsa.dto.request;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationResendRequest {

    private UUID verificationId;
}