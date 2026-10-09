package com.vsa.exception;

/**
 * Thrown when an availability invite link is unknown, revoked, or expired. All three share one message so the link's state is not revealed.
 *
 * <p>Mapped to 404 Not Found by {@link GlobalExceptionHandler}.
 *
 * @author VSA Development Team
 */
public class InvalidLinkException extends RuntimeException {

    public InvalidLinkException(String message) {
        super(message);
    }
}
