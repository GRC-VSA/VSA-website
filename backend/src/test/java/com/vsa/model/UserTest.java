package com.vsa.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class UserTest {

    @Test
    void prePersist_SetsCreatedAt() {
        User user = new User();
        user.prePersist();

        assertNotNull(user.getCreatedAt());
    }

    @Test
    void userDefaults() {
        User user = new User();
        assertEquals("student", user.getRole());
        assertFalse(user.isEmailVerified());
    }

    @Test
    void verificationSessionDefaults() {
        User user = new User();

        assertEquals(0, user.getVerificationAttempts());
        assertNull(user.getVerificationId());
        assertNull(user.getVerificationCodeHash());
        assertNull(user.getVerificationCodeSentAt());
        assertNull(user.getVerificationExpiresAt());
    }
}