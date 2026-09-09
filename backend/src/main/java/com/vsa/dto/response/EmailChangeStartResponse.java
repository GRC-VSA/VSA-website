package com.vsa.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * Returned when an email change has been started and a code sent to the new address.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@AllArgsConstructor
public class EmailChangeStartResponse {

    /** Masked form of the address the code went to, safe to display back. */
    private String maskedEmail;

    /** When the code stops being accepted. */
    private LocalDateTime expiresAt;
}