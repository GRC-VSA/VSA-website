package com.vsa.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a requested resource is not found in the database.
 *
 * <p>Returns HTTP 404 (Not Found) status when this exception is thrown. Includes the resource type
 * and ID in the error message for debugging.
 *
 * @author VSA Development Team
 */
@Getter
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
  // ── Exception Fields ───────────────────────────────────────

  /** The type of resource that was not found (e.g., "Event", "Product", "User") */
  private final String resourceName;

  /** The ID of the resource that was not found */
  private final Long resourceId;

  /**
   * Constructs a ResourceNotFoundException with resource details.
   *
   * @param resourceName The type of resource (e.g., "Event")
   * @param resourceId The ID of the resource that was not found
   */
  public ResourceNotFoundException(String resourceName, Long resourceId) {
    super("Resource with id " + resourceId + " not found");
    this.resourceName = resourceName;
    this.resourceId = resourceId;
  }
}
