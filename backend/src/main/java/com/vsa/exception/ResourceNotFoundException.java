package com.vsa.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@Getter
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

  private final String resourceName;
  private final Long resourceId;

  public ResourceNotFoundException(String resourceName, Long resourceId) {
    super("Resource with id " + resourceId + " not found");
    this.resourceName = resourceName;
    this.resourceId = resourceId;
  }
}
