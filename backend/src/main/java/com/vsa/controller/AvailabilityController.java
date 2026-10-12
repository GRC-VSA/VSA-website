package com.vsa.controller;

import com.vsa.controller.AvailabilityDtos.CreateInviteRequest;
import com.vsa.controller.AvailabilityDtos.InviteResponse;
import com.vsa.controller.AvailabilityDtos.SaveEntryRequest;
import com.vsa.controller.AvailabilityDtos.SaveSheetRequest;
import com.vsa.controller.AvailabilityDtos.SheetDetailResponse;
import com.vsa.controller.AvailabilityDtos.SheetSummaryResponse;
import com.vsa.service.AvailabilityService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for officers' availability sheets.
 *
 * <p>Base endpoint: /api/availability. Officer or president JWT required (see SecurityConfig).
 * Guest endpoints live in {@link AvailabilityInviteController}.
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {
    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    // ── Sheets ─────────────────────────────────────────────────

    @GetMapping("/sheets")
    public List<SheetSummaryResponse> listSheets(Principal principal) {
        return availabilityService.listSheets(principal.getName());
    }

    @PostMapping("/sheets")
    public ResponseEntity<SheetDetailResponse> createSheet(
            Principal principal, @Valid @RequestBody SaveSheetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(availabilityService.createSheet(principal.getName(), request));
    }

    @GetMapping("/sheets/{sheetId}")
    public SheetDetailResponse getSheet(Principal principal, @PathVariable Long sheetId) {
        return availabilityService.getSheet(principal.getName(), sheetId);
    }

    @PutMapping("/sheets/{sheetId}")
    public SheetDetailResponse updateSheet(
            Principal principal,
            @PathVariable Long sheetId,
            @Valid @RequestBody SaveSheetRequest request) {
        return availabilityService.updateSheet(principal.getName(), sheetId, request);
    }

    @PostMapping("/sheets/{sheetId}/close")
    public SheetDetailResponse closeSheet(Principal principal, @PathVariable Long sheetId) {
        return availabilityService.closeSheet(principal.getName(), sheetId);
    }

    @PostMapping("/sheets/{sheetId}/reopen")
    public SheetDetailResponse reopenSheet(Principal principal, @PathVariable Long sheetId) {
        return availabilityService.reopenSheet(principal.getName(), sheetId);
    }

    @DeleteMapping("/sheets/{sheetId}")
    public ResponseEntity<Void> deleteSheet(Principal principal, @PathVariable Long sheetId) {
        availabilityService.deleteSheet(principal.getName(), sheetId);
        return ResponseEntity.noContent().build();
    }

    // ── Own entry ──────────────────────────────────────────────

    /** Create or replace the caller's selection. Returns the refreshed sheet (heatmap included). */
    @PutMapping("/sheets/{sheetId}/my-entry")
    public SheetDetailResponse saveMyEntry(
            Principal principal,
            @PathVariable Long sheetId,
            @Valid @RequestBody SaveEntryRequest request) {
        return availabilityService.saveMyEntry(principal.getName(), sheetId, request);
    }

    @DeleteMapping("/sheets/{sheetId}/my-entry")
    public ResponseEntity<Void> deleteMyEntry(Principal principal, @PathVariable Long sheetId) {
        availabilityService.deleteMyEntry(principal.getName(), sheetId);
        return ResponseEntity.noContent().build();
    }

    /** Sheet manager removes someone's entry. */
    @DeleteMapping("/entries/{participantId}")
    public ResponseEntity<Void> removeEntry(Principal principal, @PathVariable Long participantId) {
        availabilityService.removeEntry(principal.getName(), participantId);
        return ResponseEntity.noContent().build();
    }

    // ── Invite links ───────────────────────────────────────────

    @GetMapping("/sheets/{sheetId}/invites")
    public List<InviteResponse> listInvites(Principal principal, @PathVariable Long sheetId) {
        return availabilityService.listInvites(principal.getName(), sheetId);
    }

    @PostMapping("/sheets/{sheetId}/invites")
    public ResponseEntity<InviteResponse> createInvite(
            Principal principal,
            @PathVariable Long sheetId,
            @Valid @RequestBody CreateInviteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(availabilityService.createInvite(principal.getName(), sheetId, request));
    }

    @PostMapping("/invites/{inviteId}/revoke")
    public InviteResponse revokeInvite(Principal principal, @PathVariable Long inviteId) {
        return availabilityService.revokeInvite(principal.getName(), inviteId);
    }
}
