package com.vsa.config;

import com.vsa.security.JwtFilter;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuration class for Spring Security.
 *
 * <p>Configures authentication, authorization, CORS, and JWT token validation. Implements stateless
 * session management with JWT-based authentication.
 *
 * <p>Authorization levels: - Public endpoints: Registration, login, verification, password reset,
 * uploads, GET requests - Officer+ only: POST, PUT, DELETE on events and products - Authenticated:
 * All other requests
 *
 * @author VSA Development Team
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
  // ── Dependencies ──────────────────────────────────────────
  private final JwtFilter jwtFilter;

  @Value("${frontend.url}")
  private String frontendUrl;

  /**
   * Constructs SecurityConfig with required dependencies.
   *
   * @param jwtFilter Filter for JWT token validation
   */
  public SecurityConfig(JwtFilter jwtFilter) {
    this.jwtFilter = jwtFilter;
  }

  // ── Bean Definitions ──────────────────────────────────────

  /**
   * Creates a BCryptPasswordEncoder bean for password hashing and verification.
   *
   * @return BCryptPasswordEncoder instance
   */
  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * Configures the main security filter chain for HTTP security.
   *
   * <p>Sets up: - CORS configuration for cross-origin requests - Stateless session management (JWT)
   * - Authorization rules for different endpoints - JWT filter integration
   *
   * @param http HttpSecurity object to configure
   * @return Configured SecurityFilterChain
   * @throws Exception If configuration fails
   */
  @Bean
  SecurityFilterChain applicationSecurity(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth
                    // ── Fully public endpoints ────────────────────────
                    .requestMatchers(
                        "/api/users/register",
                        "/api/users/login",
                        "/api/users/verify",
                        "/api/users/forgot-password",
                        "/api/users/reset-password",
                        "/uploads/**")
                    .permitAll()

                    // ── Read-only endpoints (anyone can browse) ──────
                    .requestMatchers(HttpMethod.GET, "/api/events/**", "/api/products/**")
                    .permitAll()

                    // ── Write endpoints (officers and presidents only) ─
                    .requestMatchers(HttpMethod.POST, "/api/events/**", "/api/products/**")
                    .hasAnyAuthority("officer", "president")
                    .requestMatchers(HttpMethod.PUT, "/api/events/**", "/api/products/**")
                    .hasAnyAuthority("officer", "president")
                    .requestMatchers(HttpMethod.DELETE, "/api/events/**", "/api/products/**")
                    .hasAnyAuthority("officer", "president")

                    // ── Everything else requires authentication ─────
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  /**
   * Configures CORS (Cross-Origin Resource Sharing) settings.
   *
   * <p>Allows requests from the configured frontend origin (`frontend.url`) with standard HTTP methods
   * and credentials.
   *
   * @return CorsConfigurationSource configured for the application
   */
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(frontendUrl));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
