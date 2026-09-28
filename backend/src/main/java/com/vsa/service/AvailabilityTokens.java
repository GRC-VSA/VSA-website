package com.vsa.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Random tokens for availability invite links and guest edit links.
 *
 * <p>Tokens are 32 random bytes, so SHA-256 is enough to store them safely and still look them up
 * by hash. (BCrypt, used elsewhere for 6-digit codes, is for short guessable secrets and can't be
 * looked up by value.)
 *
 * @author VSA Development Team
 */
final class AvailabilityTokens {
    private static final SecureRandom RANDOM = new SecureRandom();

    private AvailabilityTokens() {}

    /** 43-character URL-safe token. */
    static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Lowercase hex SHA-256, 64 characters. */
    static String sha256Hex(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
