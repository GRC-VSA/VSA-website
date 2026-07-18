package com.vsa.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Utility class for JWT (JSON Web Token) operations.
 *
 * <p>Handles token generation, validation, and claim extraction. Configured with secret key and
 * expiration time from application properties.
 *
 * @author VSA Development Team
 */
@Component
public class JwtUtil {
  // ── Configuration ──────────────────────────────────────────

  /** Secret key for JWT signing and verification (from jwt.secret property) */
  @Value("${jwt.secret}")
  private String secret;

  /** Token expiration time in milliseconds (from jwt.expiration property) */
  @Value("${jwt.expiration}")
  private long expiration;

  // ── Private Methods ───────────────────────────────────────

  /**
   * Gets the HMAC SHA signing key for token operations.
   *
   * @return SecretKey for JWT signing/verification
   */
  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  /**
   * Extracts and parses claims from a JWT token.
   *
   * @param token The JWT token
   * @return Claims object containing token payload
   * @throws JwtException If token is invalid or signature is incorrect
   * @throws IllegalArgumentException If token parsing fails
   */
  private Claims getClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  // ── Token Generation ──────────────────────────────────────

  /**
   * Generates a new JWT token for a user.
   *
   * <p>Includes the user's email as the subject and role as a custom claim. Token expiration is
   * determined by the configured expiration time.
   *
   * @param email User's email to include in token
   * @param role User's role to include in token
   * @return Signed JWT token as a compact string
   */
  public String generateToken(String email, String role) {
    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(getSigningKey())
        .compact();
  }

  // ── Token Validation ──────────────────────────────────────

  /**
   * Checks if a JWT token is valid and not expired.
   *
   * @param token The JWT token to validate
   * @return true if token is valid, false otherwise
   */
  public boolean isTokenValid(String token) {
    try {
      getClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  // ── Claim Extraction ──────────────────────────────────────

  /**
   * Extracts the email from a valid JWT token.
   *
   * @param token The JWT token
   * @return The email contained in the token's subject field
   */
  public String extractEmail(String token) {
    return getClaims(token).getSubject();
  }

  /**
   * Extracts the role from a valid JWT token.
   *
   * @param token The JWT token
   * @return The role contained in the token's custom claim
   */
  public String extractRole(String token) {
    return getClaims(token).get("role", String.class);
  }
}
