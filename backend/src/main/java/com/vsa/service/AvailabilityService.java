package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.CreateInviteRequest;
import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.controller.AvailabilityDtos.HeatmapResponse;
import com.vsa.controller.AvailabilityDtos.InviteResponse;
import com.vsa.controller.AvailabilityDtos.MyEntryResponse;
import com.vsa.controller.AvailabilityDtos.ResponderResponse;
import com.vsa.controller.AvailabilityDtos.RespondersResponse;
import com.vsa.controller.AvailabilityDtos.SaveEntryRequest;
import com.vsa.controller.AvailabilityDtos.SaveSheetRequest;
import com.vsa.controller.AvailabilityDtos.SheetDetailResponse;
import com.vsa.controller.AvailabilityDtos.SheetSummaryResponse;
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
import com.vsa.repository.AvailabilityInviteRepository;
import com.vsa.repository.AvailabilityParticipantRepository;
import com.vsa.repository.AvailabilitySheetRepository;
import com.vsa.repository.EventRepository;
import com.vsa.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Officer side of availability sheets: creating and managing sheets, filling in your own entry,
 * and managing invite links for outsiders.
 *
 * <p>Permissions: any officer or president can view every sheet and fill in their own entry. Only
 * the sheet's creator or the president can edit, close, reopen or delete a sheet, remove someone's
 * entry, or create and revoke invite links.
 *
 * @author VSA Development Team
 */
@Service
@Transactional
public class AvailabilityService {

    /** Roles expected to answer every sheet. Matches the authorities used in SecurityConfig. */
    static final Set<String> OFFICER_ROLES = Set.of("officer", "president");

    static final String DEFAULT_TIMEZONE = "America/Los_Angeles";
    static final int MAX_DAYS = 14;
    static final int MAX_ROWS = 28;

    private final AvailabilitySheetRepository sheetRepository;
    private final AvailabilityParticipantRepository participantRepository;
    private final AvailabilityInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AvailabilityHeatmapBuilder heatmapBuilder;

    public AvailabilityService(
            AvailabilitySheetRepository sheetRepository,
            AvailabilityParticipantRepository participantRepository,
            AvailabilityInviteRepository inviteRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            AvailabilityHeatmapBuilder heatmapBuilder) {
        this.sheetRepository = sheetRepository;
        this.participantRepository = participantRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.heatmapBuilder = heatmapBuilder;
    }

    // ── Sheets ─────────────────────────────────────────────────

    /** Every sheet, unsorted (the frontend sorts by closest deadline). */
    public List<SheetSummaryResponse> listSheets(String email) {
        User me = requireUser(email);
        Instant now = Instant.now();

        Map<Long, Long> entryCounts = new HashMap<>();
        for (Object[] row : participantRepository.countEntriesPerSheet()) {
            entryCounts.put((Long) row[0], ((Number) row[1]).longValue());
        }
        Set<Long> answered = new HashSet<>(participantRepository.findSheetIdsAnsweredBy(me.getUid()));

        return sheetRepository.findAllForList().stream()
                .map(
                        sheet ->
                                new SheetSummaryResponse(
                                        sheet.getSheetId(),
                                        sheet.getTitle(),
                                        sheet.getDescription(),
                                        AvailabilityMapper.location(sheet),
                                        sheet.getSheetType(),
                                        AvailabilityMapper.eventId(sheet),
                                        sheet.getDateStart(),
                                        sheet.getDateEnd(),
                                        sheet.getClosesAt(),
                                        sheet.isOpenAt(now),
                                        entryCounts.getOrDefault(sheet.getSheetId(), 0L),
                                        answered.contains(sheet.getSheetId()),
                                        AvailabilityMapper.fullName(sheet.getCreatedBy()),
                                        canManage(me, sheet)))
                .toList();
    }

    public SheetDetailResponse getSheet(String email, Long sheetId) {
        return buildDetail(requireUser(email), requireSheet(sheetId));
    }

    public SheetDetailResponse createSheet(String email, SaveSheetRequest request) {
        User me = requireUser(email);
        if (request.closesAt() != null && !request.closesAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("The deadline must be in the future");
        }

        AvailabilitySheet sheet = new AvailabilitySheet();
        sheet.setSheetType(request.sheetType());
        sheet.setEvent(resolveEvent(request));
        sheet.setCreatedBy(me);
        applyDetails(sheet, request);
        applyGrid(sheet, request);

        sheetRepository.save(sheet);
        return buildDetail(me, sheet);
    }

    /**
     * Updates a sheet. Title, description, location and deadline can always change. Days, times,
     * slot length and time zone are locked once anyone has answered, because existing selections
     * would no longer line up with the grid.
     */
    public SheetDetailResponse updateSheet(String email, Long sheetId, SaveSheetRequest request) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireManager(me, sheet);

        if (request.sheetType() != sheet.getSheetType()
                || !Objects.equals(request.eventId(), AvailabilityMapper.eventId(sheet))) {
            throw new IllegalArgumentException("A sheet's type and event can't be changed");
        }
        if (participantRepository.existsBySheet_SheetId(sheetId) && gridChanges(sheet, request)) {
            throw new ConflictException(
                    "People have already responded, so the days and times can't change."
                            + " Create a new sheet instead.");
        }

        applyDetails(sheet, request);
        applyGrid(sheet, request);
        return buildDetail(me, sheet);
    }

    public SheetDetailResponse closeSheet(String email, Long sheetId) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireManager(me, sheet);
        sheet.setStatus(Status.CLOSED);
        return buildDetail(me, sheet);
    }

    /**
     * Reopens a sheet. A deadline that has already passed is cleared, or reopening would do nothing.
     */
    public SheetDetailResponse reopenSheet(String email, Long sheetId) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireManager(me, sheet);
        sheet.setStatus(Status.OPEN);
        if (sheet.getClosesAt() != null && !sheet.getClosesAt().isAfter(Instant.now())) {
            sheet.setClosesAt(null);
        }
        return buildDetail(me, sheet);
    }

    /** Deletes a sheet. Invites, entries and slots go with it (ON DELETE CASCADE). */
    public void deleteSheet(String email, Long sheetId) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireManager(me, sheet);
        sheetRepository.delete(sheet);
    }

    // ── Own entry ──────────────────────────────────────────────

    /**
     * Creates or replaces the caller's entry. There is only ever one entry per officer per sheet;
     * saving again edits it.
     */
    public SheetDetailResponse saveMyEntry(String email, Long sheetId, SaveEntryRequest request) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireOpen(sheet);
        AvailabilityGrid.validateSlots(sheet, request.slots());

        AvailabilityParticipant entry =
                participantRepository
                        .findBySheet_SheetIdAndUser_Uid(sheetId, me.getUid())
                        .orElseGet(
                                () -> {
                                    AvailabilityParticipant created = new AvailabilityParticipant();
                                    created.setSheet(sheet);
                                    created.setUser(me);
                                    return created;
                                });
        entry.setRoleLabel(AvailabilityMapper.officerLabel(me.getRole()));
        entry.setNote(AvailabilityMapper.trimToNull(request.note()));
        entry.setUpdatedAt(LocalDateTime.now());
        AvailabilityGrid.applySlots(entry, request.slots());

        // Flush now so a racing duplicate fails here (409) and the heatmap below includes this save.
        participantRepository.saveAndFlush(entry);
        return buildDetail(me, sheet);
    }

    public void deleteMyEntry(String email, Long sheetId) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireOpen(sheet);
        participantRepository
                .findBySheet_SheetIdAndUser_Uid(sheetId, me.getUid())
                .ifPresent(participantRepository::delete);
    }

    /** Lets the sheet's manager remove anyone's entry, e.g. a guest who lost their link. */
    public void removeEntry(String email, Long participantId) {
        User me = requireUser(email);
        AvailabilityParticipant entry =
                participantRepository
                        .findById(participantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Availability entry", participantId));
        requireManager(me, entry.getSheet());
        participantRepository.delete(entry);
    }

    // ── Invite links ───────────────────────────────────────────

    /** Any officer can see a sheet's links, so anyone on the board can share them. */
    public List<InviteResponse> listInvites(String email, Long sheetId) {
        requireUser(email);
        requireSheet(sheetId);
        Instant now = Instant.now();
        return inviteRepository.findBySheet_SheetIdOrderByCreatedAtAsc(sheetId).stream()
                .map(invite -> AvailabilityMapper.invite(invite, now))
                .toList();
    }

    public InviteResponse createInvite(String email, Long sheetId, CreateInviteRequest request) {
        User me = requireUser(email);
        AvailabilitySheet sheet = requireSheet(sheetId);
        requireManager(me, sheet);
        Instant now = Instant.now();
        if (request.expiresAt() != null && !request.expiresAt().isAfter(now)) {
            throw new IllegalArgumentException("The link's expiry must be in the future");
        }

        AvailabilityInvite invite = new AvailabilityInvite();
        invite.setSheet(sheet);
        invite.setToken(AvailabilityTokens.newToken());
        String label = AvailabilityMapper.trimToNull(request.label());
        invite.setLabel(label == null ? "Guest" : label);
        invite.setExpiresAt(request.expiresAt());
        invite.setMaxUses(request.maxUses());
        invite.setCreatedBy(me);
        inviteRepository.save(invite);
        return AvailabilityMapper.invite(invite, now);
    }

    /** Revokes a link. Entries already made through it stay. */
    public InviteResponse revokeInvite(String email, Long inviteId) {
        User me = requireUser(email);
        AvailabilityInvite invite =
                inviteRepository
                        .findById(inviteId)
                        .orElseThrow(() -> new ResourceNotFoundException("Availability invite", inviteId));
        requireManager(me, invite.getSheet());
        Instant now = Instant.now();
        if (invite.getRevokedAt() == null) {
            invite.setRevokedAt(now);
        }
        return AvailabilityMapper.invite(invite, now);
    }

    // ── Detail view ────────────────────────────────────────────

    private SheetDetailResponse buildDetail(User me, AvailabilitySheet sheet) {
        GridResponse grid = AvailabilityGrid.build(sheet);
        List<AvailabilityParticipant> entries =
                participantRepository.findAllOnSheet(sheet.getSheetId());
        HeatmapResponse heatmap = heatmapBuilder.build(sheet, grid, entries.size());

        MyEntryResponse mine =
                entries.stream()
                        .filter(p -> !p.isGuest() && p.getUser().getUid().equals(me.getUid()))
                        .findFirst()
                        .map(AvailabilityMapper::myEntry)
                        .orElse(null);

        return new SheetDetailResponse(
                AvailabilityMapper.sheetInfo(sheet, Instant.now()),
                grid,
                heatmap,
                buildResponders(entries),
                mine,
                canManage(me, sheet));
    }

    /**
     * Officers first (alphabetical, non-responders included so the UI can grey them out), then
     * anyone who answered as an officer but has since lost the role, then guests.
     */
    private RespondersResponse buildResponders(List<AvailabilityParticipant> entries) {
        Map<String, AvailabilityParticipant> byUid = new HashMap<>();
        List<AvailabilityParticipant> guests = new ArrayList<>();
        for (AvailabilityParticipant entry : entries) {
            if (entry.isGuest()) {
                guests.add(entry);
            } else {
                byUid.put(entry.getUser().getUid(), entry);
            }
        }

        List<User> officers = new ArrayList<>(userRepository.findByRoleIn(OFFICER_ROLES));
        officers.sort(
                Comparator.comparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(User::getLastName, String.CASE_INSENSITIVE_ORDER));

        List<ResponderResponse> people = new ArrayList<>();
        int respondedOfficers = 0;
        for (User officer : officers) {
            AvailabilityParticipant entry = byUid.remove(officer.getUid());
            if (entry != null) {
                respondedOfficers++;
            }
            people.add(
                    new ResponderResponse(
                            entry == null ? null : entry.getParticipantId(),
                            AvailabilityMapper.fullName(officer),
                            AvailabilityMapper.officerLabel(officer.getRole()),
                            false,
                            entry != null,
                            entry == null ? null : entry.getNote()));
        }

        for (AvailabilityParticipant former : byUid.values()) {
            people.add(
                    new ResponderResponse(
                            former.getParticipantId(),
                            former.displayName(),
                            former.getRoleLabel(),
                            false,
                            true,
                            former.getNote()));
        }

        guests.sort(
                Comparator.comparing(
                        AvailabilityParticipant::getGuestName, String.CASE_INSENSITIVE_ORDER));
        for (AvailabilityParticipant guest : guests) {
            people.add(
                    new ResponderResponse(
                            guest.getParticipantId(),
                            guest.getGuestName(),
                            guest.getRoleLabel(),
                            true,
                            true,
                            guest.getNote()));
        }

        return new RespondersResponse(officers.size(), respondedOfficers, guests.size(), people);
    }

    // ── Sheet validation ───────────────────────────────────────

    private Event resolveEvent(SaveSheetRequest request) {
        if (request.sheetType() == SheetType.EVENT) {
            if (request.eventId() == null) {
                throw new IllegalArgumentException("An event sheet needs an event");
            }
            return eventRepository
                    .findById(request.eventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId()));
        }
        if (request.eventId() != null) {
            throw new IllegalArgumentException("Only event sheets can be linked to an event");
        }
        return null;
    }

    private void applyDetails(AvailabilitySheet sheet, SaveSheetRequest request) {
        sheet.setTitle(request.title().trim());
        sheet.setDescription(AvailabilityMapper.trimToNull(request.description()));
        sheet.setLocation(AvailabilityMapper.trimToNull(request.location()));
        sheet.setClosesAt(request.closesAt());
    }

    /** Validates and sets the grid fields. Mirrors the CHECK constraints in the schema. */
    private void applyGrid(AvailabilitySheet sheet, SaveSheetRequest request) {
        int slot = slotMinutes(request);
        if (slot != 30 && slot != 60) {
            throw new IllegalArgumentException("Slots must be 30 or 60 minutes long");
        }
        String zone = timezone(request);
        try {
            ZoneId.of(zone);
        } catch (DateTimeException e) {
            throw new IllegalArgumentException("Unknown time zone: " + zone);
        }

        LocalDate start = request.dateStart();
        LocalDate end = request.dateEnd();
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("The last day can't be before the first day");
        }
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        if (days > MAX_DAYS) {
            throw new IllegalArgumentException("A sheet can cover at most " + MAX_DAYS + " days");
        }

        LocalTime from = request.dayStartTime();
        LocalTime to = request.dayEndTime();
        if (!to.isAfter(from)) {
            throw new IllegalArgumentException("The end time must be after the start time");
        }
        if (from.toSecondOfDay() % 1800 != 0
                || to.toSecondOfDay() % 1800 != 0
                || from.getNano() != 0
                || to.getNano() != 0) {
            throw new IllegalArgumentException("Times must be on the hour or half hour");
        }
        long minutes = Duration.between(from, to).toMinutes();
        if (minutes % slot != 0) {
            throw new IllegalArgumentException(
                    "The time range must fit a whole number of " + slot + "-minute slots");
        }
        if (minutes / slot > MAX_ROWS) {
            throw new IllegalArgumentException(
                    "A day can have at most " + MAX_ROWS + " rows; shorten the time range");
        }

        if (request.sheetType() == SheetType.GENERAL) {
            LocalDate qStart = request.quarterStart();
            LocalDate qEnd = request.quarterEnd();
            if (qStart == null || qEnd == null) {
                throw new IllegalArgumentException("A general sheet needs the quarter's start and end");
            }
            if (qEnd.isBefore(qStart)) {
                throw new IllegalArgumentException("The quarter can't end before it starts");
            }
            if (days != 7) {
                throw new IllegalArgumentException("A general sheet must cover exactly one week");
            }
            if (start.isBefore(qStart) || end.isAfter(qEnd)) {
                throw new IllegalArgumentException("The sample week must fall inside the quarter");
            }
            sheet.setQuarterStart(qStart);
            sheet.setQuarterEnd(qEnd);
        } else {
            if (request.quarterStart() != null || request.quarterEnd() != null) {
                throw new IllegalArgumentException("Only general sheets have a quarter");
            }
            sheet.setQuarterStart(null);
            sheet.setQuarterEnd(null);
        }

        sheet.setDateStart(start);
        sheet.setDateEnd(end);
        sheet.setDayStartTime(from);
        sheet.setDayEndTime(to);
        sheet.setSlotMinutes(slot);
        sheet.setTimezone(zone);
    }

    private boolean gridChanges(AvailabilitySheet sheet, SaveSheetRequest request) {
        return !request.dateStart().equals(sheet.getDateStart())
                || !request.dateEnd().equals(sheet.getDateEnd())
                || !request.dayStartTime().equals(sheet.getDayStartTime())
                || !request.dayEndTime().equals(sheet.getDayEndTime())
                || slotMinutes(request) != sheet.getSlotMinutes()
                || !timezone(request).equals(sheet.getTimezone());
    }

    private static int slotMinutes(SaveSheetRequest request) {
        return request.slotMinutes() == null ? 30 : request.slotMinutes();
    }

    private static String timezone(SaveSheetRequest request) {
        String zone = AvailabilityMapper.trimToNull(request.timezone());
        return zone == null ? DEFAULT_TIMEZONE : zone;
    }

    // ── Lookups and permission checks ──────────────────────────

    private User requireUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
    }

    private AvailabilitySheet requireSheet(Long sheetId) {
        return sheetRepository
                .findById(sheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability sheet", sheetId));
    }

    static boolean canManage(User user, AvailabilitySheet sheet) {
        return "president".equalsIgnoreCase(user.getRole())
                || sheet.getCreatedBy().getUid().equals(user.getUid());
    }

    private static void requireManager(User user, AvailabilitySheet sheet) {
        if (!canManage(user, sheet)) {
            throw new ForbiddenException("Only the sheet's creator or the president can do this");
        }
    }

    static void requireOpen(AvailabilitySheet sheet) {
        if (!sheet.isOpenAt(Instant.now())) {
            throw new ConflictException("This availability sheet is closed");
        }
    }
}
