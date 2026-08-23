package com.vsa.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

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
   * API. Permits standard HTTP methods for API operations and allows credentials.
   *
   * @param registry CorsRegistry to configure
   */
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(parseAllowedOrigins().toArray(new String[0]))
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  private List<String> parseAllowedOrigins() {
    return Arrays.stream(frontendUrl.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .collect(Collectors.toList());
  }

}
