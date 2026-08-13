package com.vsa.exception;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for REST endpoints.
 *
 * <p>Centralized error handling that catches exceptions thrown across all controllers and returns
 * consistent JSON error responses with appropriate HTTP status codes.
 *
 * <p>Handles: - 400 Bad Request: IllegalArgumentException (validation, format, duplicate, etc.) -
 * 404 Not Found: ResourceNotFoundException (resource doesn't exist) - 500 Internal Server Error:
 * General exceptions (uncaught errors)
 *
 * @author VSA Development Team
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Handles IllegalArgumentException (400 Bad Request).
   *
   * <p>Used for validation errors, duplicate records, format errors, etc.
   *
   * @param ex The exception with error details
   * @return ResponseEntity with 400 status and error information
   */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(
            Map.of(
                "timestamp",
                LocalDateTime.now(),
                "status",
                400,
                "error",
                "Bad Request",
                "message",
                ex.getMessage()));
  }

  /**
   * Handles ResourceNotFoundException (404 Not Found).
   *
   * <p>Used when a requested resource (event, product, user) doesn't exist.
   *
   * @param ex The exception with resource details
   * @return ResponseEntity with 404 status and error information
   */
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(
            Map.of(
                "timestamp",
                LocalDateTime.now(),
                "status",
                404,
                "error",
                "Not Found",
                "message",
                ex.getMessage()));
  }

  /**
   * Handles all other exceptions (500 Internal Server Error).
   *
   * <p>Catches any uncaught exceptions not handled by specific handlers. Provides a generic error
   * response for unexpected errors.
   *
   * @param ex The exception that was thrown
   * @return ResponseEntity with 500 status and error information
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            Map.of(
                "timestamp",
                LocalDateTime.now(),
                "status",
                500,
                "error",
                "Internal Server Error",
                "message",
                ex.getMessage()));
  }
}
