package com.vsa.exception;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

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

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    String message =
            ex.getBindingResult().getFieldErrors().stream()
                    .findFirst()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .orElse("Request validation failed");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(
                    Map.of(
                            "timestamp", LocalDateTime.now(),
                            "status", 400,
                            "error", "Bad Request",
                            "message", message));
  }

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

  // ── Availability feature additions ─────────────────────────

  /**
   * Handles ForbiddenException (403 Forbidden).
   *
   * @param ex The exception with error details
   * @return ResponseEntity with 403 status and error information
   */
  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
    return errorBody(HttpStatus.FORBIDDEN, ex.getMessage());
  }

  /**
   * Handles ConflictException (409 Conflict).
   *
   * @param ex The exception with error details
   * @return ResponseEntity with 409 status and error information
   */
  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<Map<String, Object>> handleConflict(ConflictException ex) {
    return errorBody(HttpStatus.CONFLICT, ex.getMessage());
  }

  /**
   * Handles InvalidLinkException (404 Not Found).
   *
   * @param ex The exception with error details
   * @return ResponseEntity with 404 status and error information
   */
  @ExceptionHandler(InvalidLinkException.class)
  public ResponseEntity<Map<String, Object>> handleInvalidLink(InvalidLinkException ex) {
    return errorBody(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  /**
   * Handles database constraint violations (409 Conflict).
   *
   * <p>Most rules are checked in the services first, so this mainly catches two requests racing
   * each other (e.g. a double-clicked Save creating two entries). The SQL error text is not sent to
   * the client.
   *
   * @param ex The exception thrown by the database layer
   * @return ResponseEntity with 409 status and a readable message
   */
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrity(
          DataIntegrityViolationException ex) {
    String detail = String.valueOf(ex.getMostSpecificCause().getMessage());
    String message =
            detail.contains("uq_participant")
                    ? "You already have an entry on this availability sheet"
                    : "This change conflicts with existing data";
    return errorBody(HttpStatus.CONFLICT, message);
  }

  /**
   * Handles malformed JSON bodies (400 Bad Request), e.g. a slot time that is not an ISO-8601
   * instant. Without this they fell through to the 500 handler.
   *
   * @param ex The exception thrown while reading the body
   * @return ResponseEntity with 400 status and error information
   */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
    return errorBody(HttpStatus.BAD_REQUEST, "Request body could not be read");
  }

  private ResponseEntity<Map<String, Object>> errorBody(HttpStatus status, String message) {
    return ResponseEntity.status(status)
            .body(
                    Map.of(
                            "timestamp", LocalDateTime.now(),
                            "status", status.value(),
                            "error", status.getReasonPhrase(),
                            "message", message == null ? "" : message));
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
