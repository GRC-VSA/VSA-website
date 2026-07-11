package com.vsa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain applicationSecurity(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
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
                    .authenticated());

    return http.build();
  }
}
