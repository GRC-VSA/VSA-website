package com.vsa.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration class for Spring Web MVC.
 *
 * <p>Configures resource handling for file uploads and web MVC mappings.
 *
 * @author VSA Development Team
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${frontend.url}")
  private String frontendUrl;


  /**
   * Registers resource handlers for static file serving.
   *
   * <p>Maps "/uploads/**" requests to files stored in the "uploads/" directory, allowing uploaded
   * files to be served directly by the web server.
   *
   * @param registry ResourceHandlerRegistry to configure
   */
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/uploads/**").addResourceLocations("file:uploads/");
  }

  /**
   * Configures CORS (Cross-Origin Resource Sharing) mappings for API endpoints.
   *
   * <p>Allows requests from the configured frontend origin (`frontend.url`) to make requests to the
   * API. Permits standard HTTP methods for API operations.
   *
   * @param registry CorsRegistry to configure
   */
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(frontendUrl)
        .allowedMethods("GET", "POST", "PUT", "DELETE");
  }
}
