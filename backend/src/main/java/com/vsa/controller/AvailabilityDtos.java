package com.vsa.controller;

import com.vsa.model.AvailabilitySheet.SheetType;
import com.vsa.model.AvailabilitySheet.Status;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Request and response records for the availability feature.
 *
 * <p>Grid-shaped fields ({@code slotStarts}, {@code counts}) are indexed [dayIndex][rowIndex], the
 * same order as {@code dates} and {@code times}. Slot times are ISO-8601 instants in UTC; the
 * frontend sends back exactly the instants it received, so it never has to do time-zone math.
 */
public final class AvailabilityDtos {
    private AvailabilityDtos() {}

    // ── Requests (officers) ────────────────────────────────────

    /**
     * Create or update a sheet. On update, {@code sheetType} and {@code eventId} must match the
     * existing sheet, and grid fields can only change while nobody has responded.
     */
    public record SaveSheetRequest(
            @NotBlank @Size(max = 150) String title,
            @Size(max = 2000) String description,
            @Size(max = 200) String location,
            @NotNull SheetType sheetType,
            Long eventId,
            LocalDate quarterStart,
            LocalDate quarterEnd,
            @NotNull LocalDate dateStart,
            @NotNull LocalDate dateEnd,
            @NotNull LocalTime dayStartTime,
            @NotNull LocalTime dayEndTime,
            Integer slotMinutes,
            @Size(max = 50) String timezone,
            Instant closesAt) {}

    /** Replaces the caller's whole selection. An empty list means "not free at any of these". */
    public record SaveEntryRequest(
            @NotNull @Size(max = 400) List<@NotNull Instant> slots, @Size(max = 1000) String note) {}

    public record CreateInviteRequest(
            @Size(max = 100) String label, Instant expiresAt, @Positive Integer maxUses) {}

    // ── Requests (guests) ──────────────────────────────────────

    public record GuestSubmitRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotNull @Size(max = 400) List<@NotNull Instant> slots,
            @Size(max = 1000) String note) {}

    /** Email can't change: it is what keeps a guest to one entry per sheet. */
    public record GuestUpdateRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull @Size(max = 400) List<@NotNull Instant> slots,
            @Size(max = 1000) String note) {}

    public record RecoverLinkRequest(@NotBlank @Email @Size(max = 150) String email) {}

    // ── Shared pieces ──────────────────────────────────────────

    public record SheetInfo(
            Long sheetId,
            String title,
            String description,
            String location,
            SheetType sheetType,
            Long eventId,
            LocalDate quarterStart,
            LocalDate quarterEnd,
            LocalDate dateStart,
            LocalDate dateEnd,
            LocalTime dayStartTime,
            LocalTime dayEndTime,
            int slotMinutes,
            String timezone,
            Status status,
            Instant closesAt,
            boolean open,
            String createdByName) {}

    /** {@code slotStarts[d][r]} is the instant for {@code dates[d]} at {@code times[r]}. */
    public record GridResponse(
            List<LocalDate> dates, List<LocalTime> times, List<List<Instant>> slotStarts) {}

    /**
     * Anonymous counts. Hidden ({@code visible = false}, {@code counts = null}) until at least
     * {@code minResponders} people have answered, so early responders can't be picked out.
     */
    public record HeatmapResponse(
            boolean visible,
            int responderCount,
            int minResponders,
            int maxCount,
            List<List<Integer>> counts) {}

    public record MyEntryResponse(List<Instant> slots, String note, LocalDateTime updatedAt) {}

    // ── Officer responses ──────────────────────────────────────

    public record SheetSummaryResponse(
            Long sheetId,
            String title,
            String description,
            String location,
            SheetType sheetType,
            Long eventId,
            LocalDate dateStart,
            LocalDate dateEnd,
            Instant closesAt,
            boolean open,
            long responseCount,
            boolean answeredByMe,
            String createdByName,
            boolean canManage) {}

    /**
     * One row of the responder list. Expected officers who haven't answered appear with {@code
     * responded = false} and a null {@code participantId} (the greyed-out names in the design).
     */
    public record ResponderResponse(
            Long participantId,
            String name,
            String roleLabel,
            boolean guest,
            boolean responded,
            String note) {}

    public record RespondersResponse(
            int expectedOfficers,
            int respondedOfficers,
            int guests,
            List<ResponderResponse> people) {}

    public record SheetDetailResponse(
            SheetInfo sheet,
            GridResponse grid,
            HeatmapResponse heatmap,
            RespondersResponse responders,
            MyEntryResponse myEntry,
            boolean canManage) {}

    public record InviteResponse(
            Long inviteId,
            String token,
            String label,
            Instant expiresAt,
            Instant revokedAt,
            Integer maxUses,
            int useCount,
            boolean active,
            LocalDateTime createdAt) {}

    // ── Guest responses ────────────────────────────────────────

    public record GuestEntryResponse(
            String name, String email, List<Instant> slots, String note, LocalDateTime updatedAt) {}

    /** What an invite link shows: counts only, never names. */
    public record GuestSheetResponse(
            SheetInfo sheet,
            GridResponse grid,
            HeatmapResponse heatmap,
            String inviteLabel,
            GuestEntryResponse myEntry) {}

    /** {@code editToken} is returned once; the frontend keeps it and puts it in the edit link. */
    public record GuestSubmitResponse(String editToken, GuestSheetResponse view) {}
}
