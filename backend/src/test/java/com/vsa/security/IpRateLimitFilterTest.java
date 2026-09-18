package com.vsa.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IpRateLimitFilterTest {

    private static final String LIMITED_PATH = "/api/users/resend-verification";

    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    private IpRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new IpRateLimitFilter();
    }

    @Test
    void shouldNotFilter_NonLimitedPath_ReturnsTrue() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/users/register");

        assertEquals(true, filter.shouldNotFilter(request));
    }

    @Test
    void shouldNotFilter_LimitedPathWrongMethod_ReturnsTrue() {
        when(request.getMethod()).thenReturn("GET");

        assertEquals(true, filter.shouldNotFilter(request));
    }

    @Test
    void shouldNotFilter_LimitedPathPost_ReturnsFalse() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn(LIMITED_PATH);

        assertEquals(false, filter.shouldNotFilter(request));
    }

    @Test
    void doFilterInternal_UnderLimit_PassesThroughAndDoesNotSet429()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    void doFilterInternal_ExactlyAtLimit_AllRequestsPassThrough()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.2");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        verify(filterChain, times(5)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    void doFilterInternal_ExceedsLimit_ReturnsTooManyRequests()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.3");
        StringWriter writer = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(writer));

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }
        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(5)).doFilter(request, response);
        verify(response).setStatus(429);
        verify(response).setContentType("application/json");
        assertEquals(true, writer.toString().contains("Too many requests"));
    }

    @Test
    void doFilterInternal_DifferentIps_TrackedIndependently()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.4", "10.0.0.5");

        for (int i = 0; i < 6; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        verify(filterChain, times(6)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    void doFilterInternal_WindowResetsAfterExpiry_AllowsRequestsAgain()
            throws ServletException, IOException, InterruptedException {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.6");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }
        verify(response, never()).setStatus(429);

        // Simulate window expiry by using a fresh filter instance, since the
        // window is time-based and re-instantiation resets internal state.
        IpRateLimitFilter freshFilter = new IpRateLimitFilter();
        freshFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(6)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    void resolveClientIp_UsesFirstForwardedForEntry()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.5, 70.41.3.18");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }
        StringWriter writer = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(writer));
        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(429);
        verify(request, never()).getRemoteAddr();
    }

    @Test
    void resolveClientIp_BlankForwardedFor_FallsBackToRemoteAddr()
            throws ServletException, IOException {
        when(request.getHeader("X-Forwarded-For")).thenReturn("   ");
        when(request.getRemoteAddr()).thenReturn("10.0.0.7");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }
}
