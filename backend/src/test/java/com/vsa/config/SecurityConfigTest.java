package com.vsa.config;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.vsa.security.JwtFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

class SecurityConfigTest {

    private SecurityConfig securityConfig;

    @BeforeEach
    void setUp() {
        JwtFilter jwtFilter = mock(JwtFilter.class);
        securityConfig = new SecurityConfig(jwtFilter);
        ReflectionTestUtils.setField(securityConfig, "frontendUrl", "http://localhost:3000");
    }

    @Test
    void passwordEncoder_ReturnsBCryptInstance() {
        BCryptPasswordEncoder encoder = securityConfig.passwordEncoder();
        assertNotNull(encoder);

        String raw = "password";
        String encoded = encoder.encode(raw);
        assertTrue(encoder.matches(raw, encoded));
    }

    @Test
    void corsConfigurationSource_ReturnsNonNull() {
        assertNotNull(securityConfig.corsConfigurationSource());
    }
}