package com.vsa.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AvailabilityTokensTest {

    @Test
    void newToken_is43UrlSafeCharsAndUnique() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 50; i++) {
            String token = AvailabilityTokens.newToken();
            assertEquals(43, token.length());
            assertTrue(token.matches("[A-Za-z0-9_-]+"));
            assertTrue(seen.add(token));
        }
    }

    @Test
    void sha256Hex_matchesKnownVectorAndIsDeterministic() {
        assertEquals(
                "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                AvailabilityTokens.sha256Hex("abc"));
        assertEquals(AvailabilityTokens.sha256Hex("x"), AvailabilityTokens.sha256Hex("x"));
        assertNotEquals(AvailabilityTokens.sha256Hex("x"), AvailabilityTokens.sha256Hex("y"));
        assertEquals(64, AvailabilityTokens.sha256Hex("anything").length());
    }
}
