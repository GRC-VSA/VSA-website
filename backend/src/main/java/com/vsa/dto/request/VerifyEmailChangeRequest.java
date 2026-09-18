package com.vsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for confirming an email change with the code sent to the new address.
 *
 * <p>No verification id here, unlike signup: the caller is authenticated, so the pending change is
 * read off their own account.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class VerifyEmailChangeRequest {

    @NotBlank private String code;
}