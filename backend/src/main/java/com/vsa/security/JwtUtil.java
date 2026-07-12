package com.vsa.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration}")
  private long expiration;

  private SecretKey getSigningKey() {
    ;
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  public String generateToken(String email, String role) {
    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(getSigningKey())
        .compact();
  }

  public String extractEmail(String token) {
    return getClaims(token).getSubject();
  }

  public String extractRole(String token) {
    return getClaims(token).get("role", String.class);
  }

  public boolean isTokenExpired(String token) {
    try {
      getClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  private Claims getClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }
}
