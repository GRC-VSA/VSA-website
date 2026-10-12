package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.vsa.controller.AvailabilityDtos.*;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ForbiddenException;
import com.vsa.exception.InvalidLinkException;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySheet.Status;
import com.vsa.model.User;
import com.vsa.repository.*;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvailabilityGuestServiceTest {

    @Mock AvailabilityInviteRepository inviteRepository;
    @Mock AvailabilityParticipantRepository participantRepository;
    @Mock UserRepository userRepository;
    @Mock AvailabilityHeatmapBuilder heatmapBuilder;
    @Mock EmailOutboxService emailOutboxService;

    AvailabilityGuestService service;
    AvailabilitySheet sheet;
    AvailabilityInvite invite;

    static final String TOKEN = "invite-token";

    @BeforeEach
    void setUp() {
        service =
                new AvailabilityGuestService(
                        inviteRepository,
                        participantRepository,
                        userRepository,
                        heatmapBuilder,
                        emailOutboxService);
        sheet = sheet(1L, user("u1", "Carol", "Chan", "officer"));
        invite = invite(2L, sheet, TOKEN);
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invite));
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(participantRepository.findBySheet_SheetIdAndGuestEmailIgnoreCase(anyLong(), any()))
                .thenReturn(Optional.empty());
        when(participantRepository.findBySheet_SheetIdAndEditTokenHash(anyLong(), any()))
                .thenReturn(Optional.empty());
        when(participantRepository.countBySheet_SheetId(1L)).thenReturn(1L);
        when(heatmapBuilder.build(any(), any(), anyLong()))
                .thenReturn(new HeatmapResponse(false, 1, 3, 0, null));
    }

    private GuestSubmitRequest submitRequest(String email) {
        return new GuestSubmitRequest("  Bob  ", email, List.of(firstSlot()), "  note ");
    }

    private AvailabilityParticipant guestWithToken(String rawToken) {
        AvailabilityParticipant guest = guestEntry(20L, sheet, "Bob");
        guest.setInvite(invite);
        guest.setEditTokenHash(AvailabilityTokens.sha256Hex(rawToken));
        when(participantRepository.findBySheet_SheetIdAndEditTokenHash(
                        1L, AvailabilityTokens.sha256Hex(rawToken)))
                .thenReturn(Optional.of(guest));
        return guest;
    }

    // ── invite validation ──────────────────────────────────────

    @Test
    void view_invalidTokensAreRejected() {
        assertThrows(InvalidLinkException.class, () -> service.view(null, null));
        assertThrows(InvalidLinkException.class, () -> service.view("  ", null));
        assertThrows(InvalidLinkException.class, () -> service.view("unknown", null));
    }

    @Test
    void view_revokedExpiredInvitesRejected() {
        invite.setRevokedAt(Instant.now().minusSeconds(5));
        assertThrows(InvalidLinkException.class, () -> service.view(TOKEN, null));

        invite.setRevokedAt(null);
        invite.setExpiresAt(Instant.now().minusSeconds(5));
        assertThrows(InvalidLinkException.class, () -> service.view(TOKEN, null));
    }

    @Test
    void view_returnsSheetWithoutEntryWhenNoEditToken() {
        GuestSheetResponse view = service.view(TOKEN, null);

        assertEquals("Planning", view.sheet().title());
        assertEquals("ISA", view.inviteLabel());
        assertNull(view.myEntry());
        assertEquals(2, view.grid().dates().size());
        verify(participantRepository, never()).findBySheet_SheetIdAndEditTokenHash(anyLong(), any());
    }

    @Test
    void view_ignoresInvalidEditToken() {
        assertNull(service.view(TOKEN, "bad").myEntry());
        assertNull(service.view(TOKEN, "   ").myEntry());
    }

    @Test
    void view_includesOwnEntryForValidEditToken() {
        AvailabilityParticipant guest = guestWithToken("edit-1");
        AvailabilityGrid.applySlots(guest, List.of(firstSlot()));

        GuestEntryResponse mine = service.view(TOKEN, " edit-1 ").myEntry();

        assertEquals("Bob", mine.name());
        assertEquals(List.of(firstSlot()), mine.slots());
    }

    // ── submit ─────────────────────────────────────────────────

    @Test
    void submit_createsGuestEntryAndReturnsRawTokenOnce() {
        GuestSubmitResponse response = service.submit(TOKEN, submitRequest("  Bob@X.com "));

        ArgumentCaptor<AvailabilityParticipant> captor =
                ArgumentCaptor.forClass(AvailabilityParticipant.class);
        verify(participantRepository).saveAndFlush(captor.capture());
        AvailabilityParticipant saved = captor.getValue();
        assertEquals("Bob", saved.getGuestName());
        assertEquals("bob@x.com", saved.getGuestEmail());
        assertEquals("note", saved.getNote());
        assertEquals("ISA", saved.getRoleLabel());
        assertSame(invite, saved.getInvite());
        assertEquals(List.of(firstSlot()), AvailabilityGrid.sortedSlots(saved));
        assertEquals(1, invite.getUseCount());
        assertEquals(AvailabilityTokens.sha256Hex(response.editToken()), saved.getEditTokenHash());
        assertNotEquals(response.editToken(), saved.getEditTokenHash());
        assertEquals("Bob", response.view().myEntry().name());
    }

    @Test
    void submit_rejectsClosedSheet() {
        sheet.setStatus(Status.CLOSED);
        assertThrows(ConflictException.class, () -> service.submit(TOKEN, submitRequest("b@x.com")));
    }

    @Test
    void submit_rejectsWhenLinkHasNoUsesLeft() {
        invite.setMaxUses(1);
        invite.setUseCount(1);
        ConflictException ex =
                assertThrows(ConflictException.class, () -> service.submit(TOKEN, submitRequest("b@x.com")));
        assertTrue(ex.getMessage().contains("limit"));
    }

    @Test
    void submit_rejectsOfficerEmailsCaseInsensitively() {
        User officer = user("u9", "Ofi", "Cer", "OFFICER");
        when(userRepository.findByEmailIgnoreCase("ofi@vsa.com")).thenReturn(Optional.of(officer));

        assertThrows(ConflictException.class, () -> service.submit(TOKEN, submitRequest("OFI@vsa.com")));
    }

    @Test
    void submit_allowsStudentAndNullRoleAccountEmails() {
        User student = user("u9", "Stu", "Dent", "student");
        User noRole = user("u10", "No", "Role", null);
        when(userRepository.findByEmailIgnoreCase("stu@vsa.com")).thenReturn(Optional.of(student));
        when(userRepository.findByEmailIgnoreCase("no@vsa.com")).thenReturn(Optional.of(noRole));

        assertDoesNotThrow(() -> service.submit(TOKEN, submitRequest("stu@vsa.com")));
        assertDoesNotThrow(() -> service.submit(TOKEN, submitRequest("no@vsa.com")));
    }

    @Test
    void submit_rejectsDuplicateEmail() {
        when(participantRepository.findBySheet_SheetIdAndGuestEmailIgnoreCase(1L, "bob@x.com"))
                .thenReturn(Optional.of(guestEntry(1L, sheet, "Bob")));

        assertThrows(ConflictException.class, () -> service.submit(TOKEN, submitRequest("bob@x.com")));
        verify(participantRepository, never()).saveAndFlush(any());
    }

    @Test
    void submit_rejectsOffGridSlotWithoutConsumingInvite() {
        GuestSubmitRequest req =
                new GuestSubmitRequest(
                        "Bob", "b@x.com", List.of(Instant.parse("2030-01-07T17:05:00Z")), null);

        assertThrows(IllegalArgumentException.class, () -> service.submit(TOKEN, req));
        assertEquals(0, invite.getUseCount());
    }

    // ── update ─────────────────────────────────────────────────

    @Test
    void update_replacesNameNoteAndSlots() {
        AvailabilityParticipant guest = guestWithToken("edit-1");
        Instant next = firstSlot().plusSeconds(1800);

        GuestSheetResponse view =
                service.update(TOKEN, "edit-1", new GuestUpdateRequest(" Robert ", List.of(next), " "));

        assertEquals("Robert", guest.getGuestName());
        assertNull(guest.getNote());
        assertEquals(List.of(next), AvailabilityGrid.sortedSlots(guest));
        assertNotNull(guest.getUpdatedAt());
        assertEquals("Robert", view.myEntry().name());
        verify(participantRepository).saveAndFlush(guest);
    }

    @Test
    void update_requiresValidEditToken() {
        GuestUpdateRequest req = new GuestUpdateRequest("Bob", List.of(), null);
        assertThrows(ForbiddenException.class, () -> service.update(TOKEN, null, req));
        assertThrows(ForbiddenException.class, () -> service.update(TOKEN, "wrong", req));
    }

    @Test
    void update_rejectsClosedSheetAndBadSlots() {
        guestWithToken("edit-1");
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        service.update(
                                TOKEN, "edit-1", new GuestUpdateRequest("Bob", List.of(Instant.EPOCH), null)));

        sheet.setStatus(Status.CLOSED);
        assertThrows(
                ConflictException.class,
                () -> service.update(TOKEN, "edit-1", new GuestUpdateRequest("Bob", List.of(), null)));
    }

    // ── withdraw ───────────────────────────────────────────────

    @Test
    void withdraw_deletesEntry() {
        AvailabilityParticipant guest = guestWithToken("edit-1");
        service.withdraw(TOKEN, "edit-1");
        verify(participantRepository).delete(guest);
    }

    @Test
    void withdraw_needsValidTokenAndOpenSheet() {
        assertThrows(ForbiddenException.class, () -> service.withdraw(TOKEN, "nope"));
        guestWithToken("edit-1");
        sheet.setStatus(Status.CLOSED);
        assertThrows(ConflictException.class, () -> service.withdraw(TOKEN, "edit-1"));
        verify(participantRepository, never()).delete(any());
    }

    // ── recoverLink ────────────────────────────────────────────

    @Test
    void recoverLink_rotatesTokenAndQueuesEmail() {
        AvailabilityParticipant guest = guestEntry(20L, sheet, "Bob");
        guest.setEditTokenHash("old");
        when(participantRepository.findBySheet_SheetIdAndGuestEmailIgnoreCase(1L, "bob@x.com"))
                .thenReturn(Optional.of(guest));

        service.recoverLink(TOKEN, new RecoverLinkRequest(" BOB@x.com "));

        ArgumentCaptor<String> path = ArgumentCaptor.forClass(String.class);
        verify(emailOutboxService)
                .queueAvailabilityEditLinkEmail(eq("bob@x.com"), eq("Bob"), eq("Planning"), path.capture());
        assertTrue(path.getValue().startsWith("/availability/invite/" + TOKEN + "?edit="));
        String rawToken = path.getValue().substring(path.getValue().indexOf("edit=") + 5);
        assertEquals(AvailabilityTokens.sha256Hex(rawToken), guest.getEditTokenHash());
        assertNotEquals("old", guest.getEditTokenHash());
    }

    @Test
    void recoverLink_unknownEmailSendsNothingAndDoesNotThrow() {
        assertDoesNotThrow(() -> service.recoverLink(TOKEN, new RecoverLinkRequest("ghost@x.com")));
        verifyNoInteractions(emailOutboxService);
    }

    @Test
    void recoverLink_invalidInviteRejected() {
        assertThrows(
                InvalidLinkException.class,
                () -> service.recoverLink("bad", new RecoverLinkRequest("a@x.com")));
    }

    @Test
    void editPath_format() {
        assertEquals("/availability/invite/a?edit=b", AvailabilityGuestService.editPath("a", "b"));
    }
}
