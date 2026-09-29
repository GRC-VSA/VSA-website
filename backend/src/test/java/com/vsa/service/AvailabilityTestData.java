package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.SaveSheetRequest;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySheet.SheetType;
import com.vsa.model.User;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/** Shared builders for the availability tests. */
final class AvailabilityTestData {
    private AvailabilityTestData() {}

    static User user(String uid, String first, String last, String role) {
        User user = new User();
        user.setUid(uid);
        user.setFirstName(first);
        user.setLastName(last);
        user.setEmail(first.toLowerCase() + "@vsa.com");
        user.setRole(role);
        return user;
    }

    /** 2 days (Mon-Tue), 09:00-11:00, 30-minute slots => 4 rows, LA time. Open, no deadline. */
    static AvailabilitySheet sheet(Long id, User creator) {
        AvailabilitySheet sheet = new AvailabilitySheet();
        sheet.setSheetId(id);
        sheet.setTitle("Planning");
        sheet.setSheetType(SheetType.MEETING);
        sheet.setDateStart(LocalDate.of(2030, 1, 7));
        sheet.setDateEnd(LocalDate.of(2030, 1, 8));
        sheet.setDayStartTime(LocalTime.of(9, 0));
        sheet.setDayEndTime(LocalTime.of(11, 0));
        sheet.setSlotMinutes(30);
        sheet.setTimezone("America/Los_Angeles");
        sheet.setCreatedBy(creator);
        return sheet;
    }

    static SaveSheetRequest request(SheetType type, Long eventId) {
        return new SaveSheetRequest(
                "  Planning  ",
                "  desc ",
                " Room 1 ",
                type,
                eventId,
                null,
                null,
                LocalDate.of(2030, 1, 7),
                LocalDate.of(2030, 1, 8),
                LocalTime.of(9, 0),
                LocalTime.of(11, 0),
                null,
                null,
                null);
    }

    static SaveSheetRequest meetingRequest() {
        return request(SheetType.MEETING, null);
    }

    static AvailabilityInvite invite(Long id, AvailabilitySheet sheet, String token) {
        AvailabilityInvite invite = new AvailabilityInvite();
        invite.setInviteId(id);
        invite.setSheet(sheet);
        invite.setToken(token);
        invite.setLabel("ISA");
        invite.setCreatedBy(sheet.getCreatedBy());
        return invite;
    }

    static AvailabilityParticipant officerEntry(Long id, AvailabilitySheet sheet, User user) {
        AvailabilityParticipant p = new AvailabilityParticipant();
        p.setParticipantId(id);
        p.setSheet(sheet);
        p.setUser(user);
        p.setRoleLabel("Officer");
        return p;
    }

    static AvailabilityParticipant guestEntry(Long id, AvailabilitySheet sheet, String name) {
        AvailabilityParticipant p = new AvailabilityParticipant();
        p.setParticipantId(id);
        p.setSheet(sheet);
        p.setGuestName(name);
        p.setGuestEmail(name.toLowerCase() + "@x.com");
        p.setRoleLabel("ISA");
        return p;
    }

    /** First cell of the standard test sheet: 2030-01-07 09:00 LA = 17:00Z. */
    static Instant firstSlot() {
        return Instant.parse("2030-01-07T17:00:00Z");
    }
}
