package com.vsa.config;

import com.vsa.security.JwtFilter;
import org.springframework.context.annotation.Bean;
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

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final JwtFilter jwtFilter;

  public SecurityConfig(JwtFilter jwtFilter) {
    this.jwtFilter = jwtFilter;
  }

  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain applicationSecurity(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(
                    session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(
                    auth ->
                            auth

                                    // ── fully public ──────────────────────────────────────
                                    .requestMatchers(
                                            "/api/users/register",
                                            "/api/users/login",
                                            "/api/users/verify",
                                            "/api/users/forgot-password",
                                            "/api/users/reset-password",
                                            "/uploads/**")
                                    .permitAll()

                                    // ── read only — anyone can browse ─────────────────────
                                    .requestMatchers(HttpMethod.GET, "/api/events/**", "/api/products/**")
                                    .permitAll()

                                    // ── write — officers only ─────────────────────────────
                                    .requestMatchers(HttpMethod.POST, "/api/events/**", "/api/products/**")
                                    .hasAnyAuthority("officer", "president")
                                    .requestMatchers(HttpMethod.PUT, "/api/events/**", "/api/products/**")
                                    .hasAnyAuthority("officer", "president")
                                    .requestMatchers(HttpMethod.DELETE, "/api/events/**", "/api/products/**")
                                    .hasAnyAuthority("officer", "president")

                                    // ── everything else requires login ────────────────────
                                    .anyRequest()
                                    .authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
