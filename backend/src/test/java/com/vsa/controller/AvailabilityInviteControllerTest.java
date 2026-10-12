package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vsa.controller.AvailabilityDtos.*;
import com.vsa.service.AvailabilityGuestService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AvailabilityInviteControllerTest {

    @Mock AvailabilityGuestService service;
    @InjectMocks AvailabilityInviteController controller;

    private final GuestSheetResponse view = new GuestSheetResponse(null, null, null, "ISA", null);

    @Test
    void headerNameIsStable() {
        assertEquals("X-Edit-Token", AvailabilityInviteController.EDIT_TOKEN_HEADER);
    }

    @Test
    void view_passesInviteAndEditToken() {
        when(service.view("tok", "edit")).thenReturn(view);
        assertSame(view, controller.view("tok", "edit"));
    }

    @Test
    void submit_returns201() {
        GuestSubmitRequest req = new GuestSubmitRequest("Bob", "b@x.com", List.of(), null);
        GuestSubmitResponse body = new GuestSubmitResponse("edit", view);
        when(service.submit("tok", req)).thenReturn(body);

        ResponseEntity<GuestSubmitResponse> response = controller.submit("tok", req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(body, response.getBody());
    }

    @Test
    void update_delegates() {
        GuestUpdateRequest req = new GuestUpdateRequest("Bob", List.of(), null);
        when(service.update("tok", "edit", req)).thenReturn(view);
        assertSame(view, controller.update("tok", "edit", req));
    }

    @Test
    void withdraw_returns204() {
        assertEquals(HttpStatus.NO_CONTENT, controller.withdraw("tok", "edit").getStatusCode());
        verify(service).withdraw("tok", "edit");
    }

    @Test
    void recover_returns202WithGenericMessage() {
        RecoverLinkRequest req = new RecoverLinkRequest("b@x.com");

        ResponseEntity<Map<String, String>> response = controller.recover("tok", req);

        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertTrue(response.getBody().get("message").startsWith("If that email"));
        verify(service).recoverLink("tok", req);
    }
}
