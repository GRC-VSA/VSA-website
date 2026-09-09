package com.vsa.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for starting an email change.
 *
 * <p>Password-gated: the email address is the account's password-reset route, so taking it over is
 * equivalent to taking over the account.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class ChangeEmailRequest {

    @NotBlank private String password;

    @NotBlank @Email private String newEmail;
}