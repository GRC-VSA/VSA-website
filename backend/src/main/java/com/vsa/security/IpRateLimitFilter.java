package com.vsa.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Applies a simple per-IP fixed-window rate limit to the resend-verification endpoint.
 *
 * <p>{@code UserService.resendVerificationCode} already enforces a 60-second cooldown per account,
 * but that does nothing to stop a single client from cycling through many different email
 * addresses to queue verification emails. This filter throttles by source IP instead, independent
 * of which account is targeted, before the request reaches the controller.
 *
 * @author VSA Development Team
 */
@Component
public class IpRateLimitFilter extends OncePerRequestFilter {
  private static final String LIMITED_PATH = "/api/users/resend-verification";
  private static final int MAX_REQUESTS_PER_WINDOW = 5;
  private static final long WINDOW_MILLIS = 60_000L;

  private final ConcurrentHashMap<String, Window> requestsByIp = new ConcurrentHashMap<>();

  private static final class Window {
    volatile long windowStart;
    final AtomicInteger count = new AtomicInteger(0);

    Window(long windowStart) {
      this.windowStart = windowStart;
    }
  }

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    return !("POST".equalsIgnoreCase(request.getMethod())
        && LIMITED_PATH.equals(request.getRequestURI()));
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String clientIp = resolveClientIp(request);
    long now = System.currentTimeMillis();

    Window window = requestsByIp.computeIfAbsent(clientIp, ip -> new Window(now));
    synchronized (window) {
      if (now - window.windowStart >= WINDOW_MILLIS) {
        window.windowStart = now;
        window.count.set(0);
      }
      if (window.count.incrementAndGet() > MAX_REQUESTS_PER_WINDOW) {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private String resolveClientIp(HttpServletRequest request) {
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
      return forwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
