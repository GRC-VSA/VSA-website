package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.GuestEntryResponse;
import com.vsa.controller.AvailabilityDtos.InviteResponse;
import com.vsa.controller.AvailabilityDtos.MyEntryResponse;
import com.vsa.controller.AvailabilityDtos.SheetInfo;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.User;
import java.time.Instant;
import java.util.Locale;

/**
 * Entity-to-response conversions shared by the officer and guest availability services.
 *
 * @author VSA Development Team
 */
final class AvailabilityMapper {
    private AvailabilityMapper() {}

    static SheetInfo sheetInfo(AvailabilitySheet sheet, Instant now) {
        return new SheetInfo(
                sheet.getSheetId(),
                sheet.getTitle(),
                sheet.getDescription(),
                location(sheet),
                sheet.getSheetType(),
                eventId(sheet),
                sheet.getQuarterStart(),
                sheet.getQuarterEnd(),
                sheet.getDateStart(),
                sheet.getDateEnd(),
                sheet.getDayStartTime(),
                sheet.getDayEndTime(),
                sheet.getSlotMinutes(),
                sheet.getTimezone(),
                sheet.getStatus(),
                sheet.getClosesAt(),
                sheet.isOpenAt(now),
                fullName(sheet.getCreatedBy()));
    }

    /** The sheet's own location, or the linked event's location for EVENT sheets. */
    static String location(AvailabilitySheet sheet) {
        if (sheet.getLocation() != null) {
            return sheet.getLocation();
        }
        return sheet.getEvent() != null ? sheet.getEvent().getLocation() : null;
    }

    static Long eventId(AvailabilitySheet sheet) {
        return sheet.getEvent() != null ? sheet.getEvent().getEventId() : null;
    }

    static String fullName(User user) {
        return user == null ? null : (user.getFirstName() + " " + user.getLastName()).trim();
    }

    /** "President" for presidents, "Officer" for everyone else on the board. */
    static String officerLabel(String role) {
        return role != null && role.toLowerCase(Locale.ROOT).equals("president")
                ? "President"
                : "Officer";
    }

    static MyEntryResponse myEntry(AvailabilityParticipant participant) {
        return new MyEntryResponse(
                AvailabilityGrid.sortedSlots(participant),
                participant.getNote(),
                participant.getUpdatedAt());
    }

    static GuestEntryResponse guestEntry(AvailabilityParticipant participant) {
        return new GuestEntryResponse(
                participant.getGuestName(),
                participant.getGuestEmail(),
                AvailabilityGrid.sortedSlots(participant),
                participant.getNote(),
                participant.getUpdatedAt());
    }

    static InviteResponse invite(AvailabilityInvite invite, Instant now) {
        return new InviteResponse(
                invite.getInviteId(),
                invite.getToken(),
                invite.getLabel(),
                invite.getExpiresAt(),
                invite.getRevokedAt(),
                invite.getMaxUses(),
                invite.getUseCount(),
                invite.isActiveAt(now),
                invite.getCreatedAt());
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
