package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import com.vsa.controller.AvailabilityDtos.*;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ForbiddenException;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySheet.SheetType;
import com.vsa.model.AvailabilitySheet.Status;
import com.vsa.model.Event;
import com.vsa.model.User;
import com.vsa.repository.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.UnaryOperator;
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
class AvailabilityServiceTest {

    @Mock AvailabilitySheetRepository sheetRepository;
    @Mock AvailabilityParticipantRepository participantRepository;
    @Mock AvailabilityInviteRepository inviteRepository;
    @Mock UserRepository userRepository;
    @Mock EventRepository eventRepository;
    @Mock AvailabilityHeatmapBuilder heatmapBuilder;

    AvailabilityService service;

    final User creator = user("u-creator", "Carol", "Chan", "officer");
    final User other = user("u-other", "Oscar", "Ng", "officer");
    final User president = user("u-pres", "Paula", "Vo", "president");
    AvailabilitySheet sheet;

    @BeforeEach
    void setUp() {
        service =
                new AvailabilityService(
                        sheetRepository,
                        participantRepository,
                        inviteRepository,
                        userRepository,
                        eventRepository,
                        heatmapBuilder);
        sheet = sheet(1L, creator);
        for (User u : List.of(creator, other, president)) {
            when(userRepository.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
        }
        when(sheetRepository.findById(1L)).thenReturn(Optional.of(sheet));
        when(participantRepository.findAllOnSheet(1L)).thenReturn(List.of());
        when(userRepository.findByRoleIn(any())).thenReturn(List.of(creator, other, president));
        when(heatmapBuilder.build(any(), any(), anyLong()))
                .thenReturn(new HeatmapResponse(false, 0, 3, 0, null));
    }

    // ── listSheets ─────────────────────────────────────────────

    @Test
    void listSheets_combinesCountsAnsweredAndPermissions() {
        AvailabilitySheet second = sheet(2L, other);
        when(sheetRepository.findAllForList()).thenReturn(List.of(sheet, second));
        when(participantRepository.countEntriesPerSheet())
                .thenReturn(java.util.Collections.singletonList(new Object[] {1L, 4L}));
        when(participantRepository.findSheetIdsAnsweredBy("u-creator")).thenReturn(List.of(2L));

        List<SheetSummaryResponse> result = service.listSheets(creator.getEmail());

        assertEquals(2, result.size());
        assertEquals(4, result.get(0).responseCount());
        assertFalse(result.get(0).answeredByMe());
        assertTrue(result.get(0).canManage());
        assertEquals(0, result.get(1).responseCount());
        assertTrue(result.get(1).answeredByMe());
        assertFalse(result.get(1).canManage());
    }

    @Test
    void listSheets_unknownUserRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.listSheets("nobody@x.com"));
    }

    // ── getSheet / detail ──────────────────────────────────────

    @Test
    void getSheet_notFound() {
        assertThrows(ResourceNotFoundException.class, () -> service.getSheet(creator.getEmail(), 99L));
    }

    @Test
    void getSheet_buildsRespondersWithNonRespondersGreyedAndGuestsLast() {
        AvailabilityParticipant otherEntry = officerEntry(10L, sheet, other);
        otherEntry.setNote("late");
        AvailabilityParticipant former = officerEntry(11L, sheet, user("u-old", "Zed", "Old", "student"));
        former.setRoleLabel("Officer");
        AvailabilityParticipant guestB = guestEntry(12L, sheet, "bob");
        AvailabilityParticipant guestA = guestEntry(13L, sheet, "Al");
        AvailabilityGrid.applySlots(otherEntry, List.of(firstSlot()));
        when(participantRepository.findAllOnSheet(1L))
                .thenReturn(List.of(otherEntry, former, guestB, guestA));

        SheetDetailResponse detail = service.getSheet(creator.getEmail(), 1L);

        RespondersResponse r = detail.responders();
        assertEquals(3, r.expectedOfficers());
        assertEquals(1, r.respondedOfficers());
        assertEquals(2, r.guests());
        List<ResponderResponse> people = r.people();
        assertEquals(
                List.of("Carol Chan", "Oscar Ng", "Paula Vo", "Zed Old", "Al", "bob"),
                people.stream().map(ResponderResponse::name).toList());
        assertFalse(people.get(0).responded());
        assertNull(people.get(0).participantId());
        assertTrue(people.get(1).responded());
        assertEquals("late", people.get(1).note());
        assertEquals("President", people.get(2).roleLabel());
        assertTrue(people.get(3).responded());
        assertTrue(people.get(4).guest());
        assertNull(detail.myEntry());
        assertTrue(detail.canManage());
        assertEquals(2, detail.grid().dates().size());
        verify(heatmapBuilder).build(any(), any(), org.mockito.ArgumentMatchers.eq(4L));
    }

    @Test
    void getSheet_includesCallersOwnEntry() {
        AvailabilityParticipant mine = officerEntry(10L, sheet, other);
        AvailabilityGrid.applySlots(mine, List.of(firstSlot()));
        AvailabilityParticipant guest = guestEntry(12L, sheet, "bob");
        when(participantRepository.findAllOnSheet(1L)).thenReturn(List.of(guest, mine));

        SheetDetailResponse detail = service.getSheet(other.getEmail(), 1L);

        assertEquals(List.of(firstSlot()), detail.myEntry().slots());
    }

    // ── createSheet ────────────────────────────────────────────

    @Test
    void createSheet_meeting_appliesDefaultsAndTrims() {
        SheetDetailResponse detail = service.createSheet(creator.getEmail(), meetingRequest());

        ArgumentCaptor<AvailabilitySheet> captor = ArgumentCaptor.forClass(AvailabilitySheet.class);
        verify(sheetRepository).save(captor.capture());
        AvailabilitySheet saved = captor.getValue();
        assertEquals("Planning", saved.getTitle());
        assertEquals("desc", saved.getDescription());
        assertEquals("Room 1", saved.getLocation());
        assertEquals(30, saved.getSlotMinutes());
        assertEquals("America/Los_Angeles", saved.getTimezone());
        assertSame(creator, saved.getCreatedBy());
        assertNull(saved.getEvent());
        assertTrue(detail.canManage());
    }

    @Test
    void createSheet_pastDeadlineRejected() {
        SaveSheetRequest req = with(r -> new SaveSheetRequest(r.title(), null, null, r.sheetType(), null, null, null, r.dateStart(), r.dateEnd(), r.dayStartTime(), r.dayEndTime(), 30, "UTC", Instant.now().minusSeconds(5)));
        assertThrows(IllegalArgumentException.class, () -> service.createSheet(creator.getEmail(), req));
        verify(sheetRepository, never()).save(any());
    }

    @Test
    void createSheet_eventSheetLinksEvent() {
        Event event = new Event();
        event.setEventId(7L);
        when(eventRepository.findById(7L)).thenReturn(Optional.of(event));

        service.createSheet(creator.getEmail(), request(SheetType.EVENT, 7L));

        ArgumentCaptor<AvailabilitySheet> captor = ArgumentCaptor.forClass(AvailabilitySheet.class);
        verify(sheetRepository).save(captor.capture());
        assertSame(event, captor.getValue().getEvent());
    }

    @Test
    void createSheet_eventSheetNeedsEventThatExists() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(creator.getEmail(), request(SheetType.EVENT, null)));
        when(eventRepository.findById(8L)).thenReturn(Optional.empty());
        assertThrows(
                ResourceNotFoundException.class,
                () -> service.createSheet(creator.getEmail(), request(SheetType.EVENT, 8L)));
    }

    @Test
    void createSheet_nonEventSheetCannotHaveEvent() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(creator.getEmail(), request(SheetType.MEETING, 7L)));
    }

    @Test
    void createSheet_generalSheetHappyPath() {
        SaveSheetRequest req = general(LocalDate.of(2030, 1, 1), LocalDate.of(2030, 3, 31), 7, 7);

        service.createSheet(creator.getEmail(), req);

        ArgumentCaptor<AvailabilitySheet> captor = ArgumentCaptor.forClass(AvailabilitySheet.class);
        verify(sheetRepository).save(captor.capture());
        assertEquals(LocalDate.of(2030, 1, 1), captor.getValue().getQuarterStart());
        assertEquals(LocalDate.of(2030, 3, 31), captor.getValue().getQuarterEnd());
    }

    @Test
    void createSheet_generalSheetValidation() {
        String email = creator.getEmail();
        // missing quarter
        assertThrows(IllegalArgumentException.class, () -> service.createSheet(email, general(null, null, 7, 7)));
        // quarter ends before it starts
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(email, general(LocalDate.of(2030, 3, 1), LocalDate.of(2030, 1, 1), 7, 7)));
        // not exactly one week
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(email, general(LocalDate.of(2030, 1, 1), LocalDate.of(2030, 3, 31), 7, 5)));
        // week outside the quarter
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(email, general(LocalDate.of(2030, 1, 20), LocalDate.of(2030, 3, 31), 7, 7)));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createSheet(email, general(LocalDate.of(2030, 1, 1), LocalDate.of(2030, 1, 10), 7, 7)));
    }

    @Test
    void createSheet_nonGeneralCannotHaveQuarter() {
        SaveSheetRequest req = with(r -> new SaveSheetRequest(r.title(), null, null, r.sheetType(), null, LocalDate.of(2030, 1, 1), null, r.dateStart(), r.dateEnd(), r.dayStartTime(), r.dayEndTime(), null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.createSheet(creator.getEmail(), req));
    }

    @Test
    void createSheet_gridValidation() {
        String email = creator.getEmail();
        LocalDate d1 = LocalDate.of(2030, 1, 7);
        // bad slot length
        assertBad(email, grid(d1, d1, 9, 0, 11, 0, 45, "UTC"));
        // unknown zone
        assertBad(email, grid(d1, d1, 9, 0, 11, 0, 30, "Mars/Base"));
        // end before start date
        assertBad(email, grid(d1, d1.minusDays(1), 9, 0, 11, 0, 30, "UTC"));
        // > 14 days
        assertBad(email, grid(d1, d1.plusDays(14), 9, 0, 11, 0, 30, "UTC"));
        // end time not after start
        assertBad(email, grid(d1, d1, 11, 0, 9, 0, 30, "UTC"));
        // off half hour
        assertBad(email, grid(d1, d1, 9, 15, 11, 0, 30, "UTC"));
        assertBad(email, grid(d1, d1, 9, 0, 11, 15, 30, "UTC"));
        // range not divisible by 60-minute slots
        assertBad(email, grid(d1, d1, 9, 0, 10, 30, 60, "UTC"));
        // too many rows
        assertBad(email, grid(d1, d1, 0, 0, 15, 0, 30, "UTC"));
    }

    @Test
    void createSheet_fourteenDaysAndTwentyEightRowsAreAllowed() {
        LocalDate d1 = LocalDate.of(2030, 1, 7);
        assertDoesNotThrow(
                () -> service.createSheet(creator.getEmail(), grid(d1, d1.plusDays(13), 8, 0, 22, 0, 30, "UTC")));
    }

    // ── updateSheet ────────────────────────────────────────────

    @Test
    void updateSheet_onlyManagerMayEdit() {
        assertThrows(ForbiddenException.class, () -> service.updateSheet(other.getEmail(), 1L, meetingRequest()));
    }

    @Test
    void updateSheet_presidentMayEditAnySheet() {
        assertDoesNotThrow(() -> service.updateSheet(president.getEmail(), 1L, meetingRequest()));
    }

    @Test
    void updateSheet_typeAndEventLocked() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateSheet(creator.getEmail(), 1L, request(SheetType.GENERAL, null)));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateSheet(creator.getEmail(), 1L, request(SheetType.MEETING, 3L)));
    }

    @Test
    void updateSheet_gridLockedOnceSomeoneResponded() {
        when(participantRepository.existsBySheet_SheetId(1L)).thenReturn(true);
        SaveSheetRequest changed = grid(LocalDate.of(2030, 1, 7), LocalDate.of(2030, 1, 9), 9, 0, 11, 0, 30, "America/Los_Angeles");

        assertThrows(ConflictException.class, () -> service.updateSheet(creator.getEmail(), 1L, changed));
    }

    @Test
    void updateSheet_gridChangeDetectedForEachField() {
        when(participantRepository.existsBySheet_SheetId(1L)).thenReturn(true);
        LocalDate s = LocalDate.of(2030, 1, 7);
        LocalDate e = LocalDate.of(2030, 1, 8);
        String la = "America/Los_Angeles";
        for (SaveSheetRequest changed :
                List.of(
                        grid(s.plusDays(1), e.plusDays(1), 9, 0, 11, 0, 30, la),
                        grid(s, e, 9, 30, 11, 0, 30, la),
                        grid(s, e, 9, 0, 11, 30, 30, la),
                        grid(s, e, 9, 0, 11, 0, 60, la),
                        grid(s, e, 9, 0, 11, 0, 30, "UTC"))) {
            assertThrows(ConflictException.class, () -> service.updateSheet(creator.getEmail(), 1L, changed));
        }
    }

    @Test
    void updateSheet_detailsCanChangeEvenAfterResponses() {
        when(participantRepository.existsBySheet_SheetId(1L)).thenReturn(true);
        Instant deadline = Instant.now().plus(2, ChronoUnit.DAYS);
        SaveSheetRequest req = with(r -> new SaveSheetRequest("New title", "d", "Loc", r.sheetType(), null, null, null, r.dateStart(), r.dateEnd(), r.dayStartTime(), r.dayEndTime(), 30, "America/Los_Angeles", deadline));

        service.updateSheet(creator.getEmail(), 1L, req);

        assertEquals("New title", sheet.getTitle());
        assertEquals(deadline, sheet.getClosesAt());
    }

    // ── close / reopen / delete ────────────────────────────────

    @Test
    void closeSheet_setsClosed_andRequiresManager() {
        assertThrows(ForbiddenException.class, () -> service.closeSheet(other.getEmail(), 1L));

        SheetDetailResponse detail = service.closeSheet(creator.getEmail(), 1L);

        assertEquals(Status.CLOSED, sheet.getStatus());
        assertFalse(detail.sheet().open());
    }

    @Test
    void reopenSheet_clearsPassedDeadlineButKeepsFutureOne() {
        sheet.setStatus(Status.CLOSED);
        sheet.setClosesAt(Instant.now().minusSeconds(60));
        service.reopenSheet(creator.getEmail(), 1L);
        assertEquals(Status.OPEN, sheet.getStatus());
        assertNull(sheet.getClosesAt());

        Instant future = Instant.now().plus(1, ChronoUnit.DAYS);
        sheet.setStatus(Status.CLOSED);
        sheet.setClosesAt(future);
        service.reopenSheet(creator.getEmail(), 1L);
        assertEquals(future, sheet.getClosesAt());

        assertThrows(ForbiddenException.class, () -> service.reopenSheet(other.getEmail(), 1L));
    }

    @Test
    void deleteSheet_managerOnly() {
        assertThrows(ForbiddenException.class, () -> service.deleteSheet(other.getEmail(), 1L));
        verify(sheetRepository, never()).delete(any());

        service.deleteSheet(creator.getEmail(), 1L);
        verify(sheetRepository).delete(sheet);
    }

    // ── my entry ───────────────────────────────────────────────

    @Test
    void saveMyEntry_createsEntryWithRoleLabelAndTrimmedNote() {
        SaveEntryRequest req = new SaveEntryRequest(List.of(firstSlot(), firstSlot()), "  hello ");
        when(participantRepository.findBySheet_SheetIdAndUser_Uid(1L, "u-pres")).thenReturn(Optional.empty());

        service.saveMyEntry(president.getEmail(), 1L, req);

        ArgumentCaptor<AvailabilityParticipant> captor = ArgumentCaptor.forClass(AvailabilityParticipant.class);
        verify(participantRepository).saveAndFlush(captor.capture());
        AvailabilityParticipant saved = captor.getValue();
        assertSame(president, saved.getUser());
        assertEquals("President", saved.getRoleLabel());
        assertEquals("hello", saved.getNote());
        assertEquals(List.of(firstSlot()), AvailabilityGrid.sortedSlots(saved));
        assertNotNull(saved.getUpdatedAt());
    }

    @Test
    void saveMyEntry_updatesExistingEntry() {
        AvailabilityParticipant existing = officerEntry(5L, sheet, other);
        AvailabilityGrid.applySlots(existing, List.of(firstSlot()));
        when(participantRepository.findBySheet_SheetIdAndUser_Uid(1L, "u-other")).thenReturn(Optional.of(existing));
        Instant next = firstSlot().plusSeconds(1800);

        service.saveMyEntry(other.getEmail(), 1L, new SaveEntryRequest(List.of(next), null));

        verify(participantRepository).saveAndFlush(existing);
        assertEquals(List.of(next), AvailabilityGrid.sortedSlots(existing));
        assertNull(existing.getNote());
    }

    @Test
    void saveMyEntry_rejectsClosedSheetAndBadSlots() {
        SaveEntryRequest bad = new SaveEntryRequest(List.of(Instant.parse("2030-01-07T17:10:00Z")), null);
        assertThrows(IllegalArgumentException.class, () -> service.saveMyEntry(creator.getEmail(), 1L, bad));

        sheet.setStatus(Status.CLOSED);
        assertThrows(
                ConflictException.class,
                () -> service.saveMyEntry(creator.getEmail(), 1L, new SaveEntryRequest(List.of(), null)));
        verify(participantRepository, never()).saveAndFlush(any());
    }

    @Test
    void saveMyEntry_rejectsAfterDeadline() {
        sheet.setClosesAt(Instant.now().minusSeconds(1));
        assertThrows(
                ConflictException.class,
                () -> service.saveMyEntry(creator.getEmail(), 1L, new SaveEntryRequest(List.of(), null)));
    }

    @Test
    void deleteMyEntry_deletesIfPresentAndIsNoopOtherwise() {
        AvailabilityParticipant mine = officerEntry(5L, sheet, other);
        when(participantRepository.findBySheet_SheetIdAndUser_Uid(1L, "u-other")).thenReturn(Optional.of(mine));
        service.deleteMyEntry(other.getEmail(), 1L);
        verify(participantRepository).delete(mine);

        when(participantRepository.findBySheet_SheetIdAndUser_Uid(1L, "u-creator")).thenReturn(Optional.empty());
        service.deleteMyEntry(creator.getEmail(), 1L);
        verify(participantRepository, times(1)).delete(any());
    }

    @Test
    void deleteMyEntry_closedSheetRejected() {
        sheet.setStatus(Status.CLOSED);
        assertThrows(ConflictException.class, () -> service.deleteMyEntry(creator.getEmail(), 1L));
    }

    @Test
    void removeEntry_managerOnlyAndMustExist() {
        AvailabilityParticipant guest = guestEntry(9L, sheet, "Bob");
        when(participantRepository.findById(9L)).thenReturn(Optional.of(guest));

        assertThrows(ForbiddenException.class, () -> service.removeEntry(other.getEmail(), 9L));
        assertThrows(ResourceNotFoundException.class, () -> service.removeEntry(creator.getEmail(), 404L));

        service.removeEntry(creator.getEmail(), 9L);
        verify(participantRepository).delete(guest);
    }

    // ── invites ────────────────────────────────────────────────

    @Test
    void listInvites_anyOfficerCanSee() {
        AvailabilityInvite invite = invite(1L, sheet, "tok");
        when(inviteRepository.findBySheet_SheetIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(invite));

        List<InviteResponse> result = service.listInvites(other.getEmail(), 1L);

        assertEquals(1, result.size());
        assertEquals("tok", result.get(0).token());
        assertTrue(result.get(0).active());
    }

    @Test
    void createInvite_defaultsLabelAndGeneratesToken() {
        InviteResponse response = service.createInvite(creator.getEmail(), 1L, new CreateInviteRequest("  ", null, 5));

        ArgumentCaptor<AvailabilityInvite> captor = ArgumentCaptor.forClass(AvailabilityInvite.class);
        verify(inviteRepository).save(captor.capture());
        assertEquals("Guest", captor.getValue().getLabel());
        assertEquals(43, captor.getValue().getToken().length());
        assertEquals(5, captor.getValue().getMaxUses());
        assertSame(sheet, captor.getValue().getSheet());
        assertEquals(captor.getValue().getToken(), response.token());
    }

    @Test
    void createInvite_keepsCustomLabel() {
        service.createInvite(creator.getEmail(), 1L, new CreateInviteRequest(" ISA ", null, null));
        ArgumentCaptor<AvailabilityInvite> captor = ArgumentCaptor.forClass(AvailabilityInvite.class);
        verify(inviteRepository).save(captor.capture());
        assertEquals("ISA", captor.getValue().getLabel());
    }

    @Test
    void createInvite_requiresManagerAndFutureExpiry() {
        assertThrows(
                ForbiddenException.class,
                () -> service.createInvite(other.getEmail(), 1L, new CreateInviteRequest(null, null, null)));
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        service.createInvite(
                                creator.getEmail(), 1L, new CreateInviteRequest(null, Instant.now().minusSeconds(1), null)));
        verify(inviteRepository, never()).save(any());
    }

    @Test
    void revokeInvite_setsTimestampOnceAndChecksPermission() {
        AvailabilityInvite invite = invite(4L, sheet, "tok");
        when(inviteRepository.findById(4L)).thenReturn(Optional.of(invite));

        assertThrows(ForbiddenException.class, () -> service.revokeInvite(other.getEmail(), 4L));
        assertThrows(ResourceNotFoundException.class, () -> service.revokeInvite(creator.getEmail(), 5L));

        InviteResponse response = service.revokeInvite(creator.getEmail(), 4L);
        Instant firstRevoke = invite.getRevokedAt();
        assertNotNull(firstRevoke);
        assertFalse(response.active());

        service.revokeInvite(creator.getEmail(), 4L);
        assertEquals(firstRevoke, invite.getRevokedAt());
    }

    // ── helpers ────────────────────────────────────────────────

    @Test
    void canManage_creatorOrPresidentOnly() {
        assertTrue(AvailabilityService.canManage(creator, sheet));
        assertTrue(AvailabilityService.canManage(president, sheet));
        assertFalse(AvailabilityService.canManage(other, sheet));
    }

    private void assertBad(String email, SaveSheetRequest req) {
        assertThrows(IllegalArgumentException.class, () -> service.createSheet(email, req));
    }

    private static SaveSheetRequest with(UnaryOperator<SaveSheetRequest> f) {
        return f.apply(meetingRequest());
    }

    private static SaveSheetRequest grid(
            LocalDate start, LocalDate end, int sh, int sm, int eh, int em, Integer slot, String zone) {
        return new SaveSheetRequest("T", null, null, SheetType.MEETING, null, null, null, start, end, LocalTime.of(sh, sm), LocalTime.of(eh, em), slot, zone, null);
    }

    private static SaveSheetRequest general(LocalDate qs, LocalDate qe, int unusedDays, int days) {
        LocalDate start = LocalDate.of(2030, 1, 7);
        return new SaveSheetRequest("Week", null, null, SheetType.GENERAL, null, qs, qe, start, start.plusDays(days - 1), LocalTime.of(9, 0), LocalTime.of(11, 0), 30, "UTC", null);
    }
}
