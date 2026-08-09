package com.vsa.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String secretKey = "vsaSecretKeyForJwtTokenGenerationMustBeLongEnough12345";
    private final long expirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secretKey);
        ReflectionTestUtils.setField(jwtUtil, "expiration", expirationMs);
    }

    @Test
    void generateToken_And_ExtractClaims_Success() {
        String email = "test@vsa.com";
        String role = "ROLE_STUDENT";

        String token = jwtUtil.generateToken(email, role);

        assertNotNull(token);
        assertTrue(jwtUtil.isTokenValid(token));
        assertEquals(email, jwtUtil.extractEmail(token));
        assertEquals(role, jwtUtil.extractRole(token));
    }

    @Test
    void isTokenValid_InvalidOrMalformedToken_ReturnsFalse() {
        assertFalse(jwtUtil.isTokenValid("invalid.jwt.string"));
        assertFalse(jwtUtil.isTokenValid(""));
    }

    @Test
    void isTokenValid_ExpiredToken_ReturnsFalse() throws InterruptedException {
        // Set a very short expiration time
        ReflectionTestUtils.setField(jwtUtil, "expiration", 1L);
        String token = jwtUtil.generateToken("user@vsa.com", "ROLE_STUDENT");

        // Wait briefly so token expires
        Thread.sleep(10);

        assertFalse(jwtUtil.isTokenValid(token));
    }
}