package com.vsa.exception;

import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.http.HttpInputMessage;

import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleBadRequest_Returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid input");
        ResponseEntity<Map<String, Object>> response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("Bad Request", response.getBody().get("error"));
        assertEquals("Invalid input", response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    void handleNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Event", 1L);
        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(404, response.getBody().get("status"));
        assertEquals("Not Found", response.getBody().get("error"));
        assertEquals("Resource with id 1 not found", response.getBody().get("message"));
    }

    @Test
    void handleGeneral_Returns500() {
        Exception ex = new Exception("Unexpected error");
        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().get("status"));
        assertEquals("Internal Server Error", response.getBody().get("error"));
        assertEquals("Unexpected error", response.getBody().get("message"));
    }

    @Test
    void handleForbidden_Returns403() {
        ResponseEntity<Map<String, Object>> response = handler.handleForbidden(new ForbiddenException("nope"));
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals(403, response.getBody().get("status"));
        assertEquals("nope", response.getBody().get("message"));
    }

    @Test
    void handleConflict_Returns409() {
        ResponseEntity<Map<String, Object>> response = handler.handleConflict(new ConflictException("dup"));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Conflict", response.getBody().get("error"));
        assertEquals("dup", response.getBody().get("message"));
    }

    @Test
    void handleInvalidLink_Returns404() {
        ResponseEntity<Map<String, Object>> response = handler.handleInvalidLink(new InvalidLinkException("bad link"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("bad link", response.getBody().get("message"));
    }

    @Test
    void handleDataIntegrity_ParticipantConstraintGivesFriendlyMessage() {
        DataIntegrityViolationException ex =
                new DataIntegrityViolationException("x", new RuntimeException("violates unique constraint uq_participant_user"));
        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrity(ex);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("You already have an entry on this availability sheet", response.getBody().get("message"));
    }

    @Test
    void handleDataIntegrity_OtherConstraintHidesSqlDetails() {
        DataIntegrityViolationException ex =
                new DataIntegrityViolationException("x", new RuntimeException("secret table detail"));
        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrity(ex);
        assertEquals("This change conflicts with existing data", response.getBody().get("message"));
    }

    @Test
    void handleUnreadable_Returns400() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleUnreadable(new HttpMessageNotReadableException("bad json", (HttpInputMessage) null));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Request body could not be read", response.getBody().get("message"));
    }
}
