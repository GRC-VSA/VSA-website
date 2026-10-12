package com.vsa.exception;

/**
 * Thrown when the request clashes with existing data, e.g. a second entry on the same sheet.
 *
 * <p>Mapped to 409 Conflict by {@link GlobalExceptionHandler}.
 *
 * @author VSA Development Team
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
