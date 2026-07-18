package com.vsa.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter for validating JWT tokens on incoming requests.
 *
 * <p>Intercepts HTTP requests to extract and validate JWT tokens from the Authorization header. On
 * successful validation, sets the user's authentication context for the request.
 *
 * <p>This filter runs once per request and is integrated into the security filter chain.
 *
 * @author VSA Development Team
 */
@Component
public class JwtFilter extends OncePerRequestFilter {
  // ── Dependencies ──────────────────────────────────────────
  private final JwtUtil jwtUtil;

  /**
   * Constructs a JwtFilter with required dependencies.
   *
   * @param jwtUtil Utility for JWT token operations
   */
  public JwtFilter(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  // ── Filter Logic ──────────────────────────────────────────

  /**
   * Main filter logic that runs for each HTTP request.
   *
   * <p>Checks for a valid JWT token in the Authorization header (format: "Bearer <token>"). If a
   * valid token is found: - Extracts the user's email and role from the token - Creates an
   * authentication token with the extracted information - Sets it in the security context for the
   * duration of the request
   *
   * <p>If no token or an invalid token is provided, the request proceeds without authentication
   * (and may be rejected by security rules later in the chain).
   *
   * @param request The HTTP request
   * @param response The HTTP response
   * @param filterChain The filter chain to proceed to the next filter
   * @throws ServletException If a servlet-related error occurs
   * @throws IOException If an I/O error occurs
   */
  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    // Extract the Authorization header
    String authorizationHeader = request.getHeader("Authorization");

    // Check if the header exists and starts with "Bearer "
    if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
      // Extract the token (remove "Bearer " prefix)
      String token = authorizationHeader.substring(7);

      // Validate the token
      if (jwtUtil.isTokenValid(token)) {
        // Extract user information from the token
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        // Create authentication token with extracted user info
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                email, null, List.of(new SimpleGrantedAuthority(role)));

        // Set authentication in the security context for this request
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    }

    // Proceed to the next filter in the chain
    filterChain.doFilter(request, response);
  }
}
