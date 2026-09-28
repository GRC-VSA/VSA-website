package com.vsa.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for editing the parts of a profile that need no re-authentication.
 *
 * <p>Every field is optional: a null field means "leave this alone", which is what makes this a
 * genuine PATCH rather than a full replace. Email and password are deliberately absent — both
 * require proving identity first and have their own endpoints.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class UpdateProfileRequest {

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @Size(max = 30)
    private String phone;
}