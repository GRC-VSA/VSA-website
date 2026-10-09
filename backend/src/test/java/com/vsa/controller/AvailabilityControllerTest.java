package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.vsa.controller.AvailabilityDtos.*;
import com.vsa.model.AvailabilitySheet.SheetType;
import com.vsa.service.AvailabilityService;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AvailabilityControllerTest {

    @Mock AvailabilityService service;
    @InjectMocks AvailabilityController controller;

    private final Principal principal = () -> "amy@vsa.com";
    private final SheetDetailResponse detail = new SheetDetailResponse(null, null, null, null, null, true);
    private final SaveSheetRequest sheetRequest =
            new SaveSheetRequest(
                    "T", null, null, SheetType.MEETING, null, null, null, LocalDate.now(), LocalDate.now(),
                    LocalTime.of(9, 0), LocalTime.of(10, 0), 30, "UTC", null);

    @Test
    void listSheets_delegatesWithPrincipalName() {
        when(service.listSheets("amy@vsa.com")).thenReturn(List.of());
        assertEquals(List.of(), controller.listSheets(principal));
    }

    @Test
    void createSheet_returns201() {
        when(service.createSheet("amy@vsa.com", sheetRequest)).thenReturn(detail);
        ResponseEntity<SheetDetailResponse> response = controller.createSheet(principal, sheetRequest);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(detail, response.getBody());
    }

    @Test
    void getUpdateCloseReopen_delegate() {
        when(service.getSheet("amy@vsa.com", 1L)).thenReturn(detail);
        when(service.updateSheet("amy@vsa.com", 1L, sheetRequest)).thenReturn(detail);
        when(service.closeSheet("amy@vsa.com", 1L)).thenReturn(detail);
        when(service.reopenSheet("amy@vsa.com", 1L)).thenReturn(detail);

        assertSame(detail, controller.getSheet(principal, 1L));
        assertSame(detail, controller.updateSheet(principal, 1L, sheetRequest));
        assertSame(detail, controller.closeSheet(principal, 1L));
        assertSame(detail, controller.reopenSheet(principal, 1L));
    }

    @Test
    void deleteSheet_returns204() {
        ResponseEntity<Void> response = controller.deleteSheet(principal, 1L);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(service).deleteSheet("amy@vsa.com", 1L);
    }

    @Test
    void myEntry_saveAndDelete() {
        SaveEntryRequest req = new SaveEntryRequest(List.of(), null);
        when(service.saveMyEntry("amy@vsa.com", 1L, req)).thenReturn(detail);

        assertSame(detail, controller.saveMyEntry(principal, 1L, req));
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteMyEntry(principal, 1L).getStatusCode());
        verify(service).deleteMyEntry("amy@vsa.com", 1L);
    }

    @Test
    void removeEntry_returns204() {
        assertEquals(HttpStatus.NO_CONTENT, controller.removeEntry(principal, 9L).getStatusCode());
        verify(service).removeEntry("amy@vsa.com", 9L);
    }

    @Test
    void invites_listCreateRevoke() {
        CreateInviteRequest req = new CreateInviteRequest("ISA", null, 3);
        InviteResponse invite = new InviteResponse(1L, "t", "ISA", null, null, 3, 0, true, null);
        when(service.listInvites("amy@vsa.com", 1L)).thenReturn(List.of(invite));
        when(service.createInvite("amy@vsa.com", 1L, req)).thenReturn(invite);
        when(service.revokeInvite("amy@vsa.com", 1L)).thenReturn(invite);

        assertEquals(List.of(invite), controller.listInvites(principal, 1L));
        ResponseEntity<InviteResponse> created = controller.createInvite(principal, 1L, req);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertSame(invite, created.getBody());
        assertSame(invite, controller.revokeInvite(principal, 1L));
    }
}
