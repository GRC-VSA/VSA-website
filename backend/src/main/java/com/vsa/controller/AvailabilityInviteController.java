package com.vsa.controller;

import com.vsa.controller.AvailabilityDtos.GuestSheetResponse;
import com.vsa.controller.AvailabilityDtos.GuestSubmitRequest;
import com.vsa.controller.AvailabilityDtos.GuestSubmitResponse;
import com.vsa.controller.AvailabilityDtos.GuestUpdateRequest;
import com.vsa.controller.AvailabilityDtos.RecoverLinkRequest;
import com.vsa.service.AvailabilityGuestService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for outsiders filling in a sheet through an invite link. No login.
 *
 * <p>Base endpoint: /api/availability/invite/{token}. A guest's own entry is identified by the
 * {@value #EDIT_TOKEN_HEADER} header, which holds the edit token returned on first submit. It is a
 * header rather than part of the path so it doesn't end up in server access logs.
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/availability/invite/{token}")
public class AvailabilityInviteController {
    public static final String EDIT_TOKEN_HEADER = "X-Edit-Token";

    private final AvailabilityGuestService guestService;

    public AvailabilityInviteController(AvailabilityGuestService guestService) {
        this.guestService = guestService;
    }

    @GetMapping
    public GuestSheetResponse view(
            @PathVariable String token,
            @RequestHeader(value = EDIT_TOKEN_HEADER, required = false) String editToken) {
        return guestService.view(token, editToken);
    }

    @PostMapping("/entry")
    public ResponseEntity<GuestSubmitResponse> submit(
            @PathVariable String token, @Valid @RequestBody GuestSubmitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guestService.submit(token, request));
    }

    @PutMapping("/entry")
    public GuestSheetResponse update(
            @PathVariable String token,
            @RequestHeader(value = EDIT_TOKEN_HEADER, required = false) String editToken,
            @Valid @RequestBody GuestUpdateRequest request) {
        return guestService.update(token, editToken, request);
    }

    @DeleteMapping("/entry")
    public ResponseEntity<Void> withdraw(
            @PathVariable String token,
            @RequestHeader(value = EDIT_TOKEN_HEADER, required = false) String editToken) {
        guestService.withdraw(token, editToken);
        return ResponseEntity.noContent().build();
    }

    /** Always 202 with the same message, whether or not the email has an entry. */
    @PostMapping("/recover")
    public ResponseEntity<Map<String, String>> recover(
            @PathVariable String token, @Valid @RequestBody RecoverLinkRequest request) {
        guestService.recoverLink(token, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(
                        Map.of(
                                "message",
                                "If that email has a response on this sheet, we've sent it a new edit link."));
    }
}
