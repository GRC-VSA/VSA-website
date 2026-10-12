package com.vsa.exception;

/**
 * Thrown when the caller is not allowed to do this, e.g. an officer editing a sheet they did not create.
 *
 * <p>Mapped to 403 Forbidden by {@link GlobalExceptionHandler}.
 *
 * @author VSA Development Team
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
