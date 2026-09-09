package com.vsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for changing a password.
 *
 * <p>The current password is required so a hijacked session can't silently lock the real owner out
 * of their own account.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank private String currentPassword;

    @NotBlank
    @Size(min = 8, max = 100)
    private String newPassword;
}