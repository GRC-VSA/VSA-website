package com.vsa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the VSA (Vietnamese Student Association) Backend Application.
 *
 * <p>This Spring Boot application provides REST APIs for managing events, products, and users for
 * the Green River College Vietnamese Student Association. It includes features such as user
 * authentication with JWT tokens, email verification, password reset, and file upload capabilities.
 *
 * @author VSA Development Team
 */
@SpringBootApplication
public class BackendApplication {

  /**
   * Main entry point of the application.
   *
   * @param args Command-line arguments passed to the application
   */
  public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
  }
}
