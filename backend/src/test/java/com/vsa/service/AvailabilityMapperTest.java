package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;

import com.vsa.controller.AvailabilityDtos.GuestEntryResponse;
import com.vsa.controller.AvailabilityDtos.InviteResponse;
import com.vsa.controller.AvailabilityDtos.MyEntryResponse;
import com.vsa.controller.AvailabilityDtos.SheetInfo;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySheet.SheetType;
import com.vsa.model.Event;
import com.vsa.model.User;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class AvailabilityMapperTest {

    private final User creator = user("u1", "Amy", "Lee", "officer");

    @Test
    void location_prefersSheetThenEventThenNull() {
        AvailabilitySheet sheet = sheet(1L, creator);
        assertNull(AvailabilityMapper.location(sheet));

        Event event = new Event();
        event.setEventId(9L);
        event.setLocation("Hall");
        sheet.setEvent(event);
        assertEquals("Hall", AvailabilityMapper.location(sheet));
        assertEquals(9L, AvailabilityMapper.eventId(sheet));

        sheet.setLocation("Room 1");
        assertEquals("Room 1", AvailabilityMapper.location(sheet));
    }

    @Test
    void eventId_nullWithoutEvent() {
        assertNull(AvailabilityMapper.eventId(sheet(1L, creator)));
    }

    @Test
    void fullName_handlesNullAndTrims() {
        assertNull(AvailabilityMapper.fullName(null));
        assertEquals("Amy Lee", AvailabilityMapper.fullName(creator));
        assertEquals("Amy", AvailabilityMapper.fullName(user("x", "Amy", "", "officer")));
    }

    @Test
    void officerLabel_presidentIsCaseInsensitive() {
        assertEquals("President", AvailabilityMapper.officerLabel("President"));
        assertEquals("President", AvailabilityMapper.officerLabel("president"));
        assertEquals("Officer", AvailabilityMapper.officerLabel("officer"));
        assertEquals("Officer", AvailabilityMapper.officerLabel(null));
    }

    @Test
    void trimToNull_coversAllBranches() {
        assertNull(AvailabilityMapper.trimToNull(null));
        assertNull(AvailabilityMapper.trimToNull("   "));
        assertEquals("a b", AvailabilityMapper.trimToNull("  a b "));
    }

    @Test
    void sheetInfo_copiesFieldsAndComputesOpen() {
        AvailabilitySheet sheet = sheet(5L, creator);
        sheet.setSheetType(SheetType.MEETING);
        sheet.setClosesAt(Instant.parse("2030-01-01T00:00:00Z"));

        SheetInfo open = AvailabilityMapper.sheetInfo(sheet, Instant.parse("2029-12-31T00:00:00Z"));
        SheetInfo closed = AvailabilityMapper.sheetInfo(sheet, Instant.parse("2030-01-02T00:00:00Z"));

        assertEquals(5L, open.sheetId());
        assertEquals("Planning", open.title());
        assertEquals(30, open.slotMinutes());
        assertEquals("Amy Lee", open.createdByName());
        assertTrue(open.open());
        assertFalse(closed.open());
    }

    @Test
    void entries_mapSlotsAndIdentity() {
        AvailabilitySheet sheet = sheet(1L, creator);
        AvailabilityParticipant guest = guestEntry(1L, sheet, "Bob");
        guest.setNote("hi");
        guest.setUpdatedAt(LocalDateTime.of(2030, 1, 1, 0, 0));
        com.vsa.service.AvailabilityGrid.applySlots(guest, List.of(firstSlot()));

        GuestEntryResponse g = AvailabilityMapper.guestEntry(guest);
        assertEquals("Bob", g.name());
        assertEquals("bob@x.com", g.email());
        assertEquals(List.of(firstSlot()), g.slots());
        assertEquals("hi", g.note());

        MyEntryResponse mine = AvailabilityMapper.myEntry(guest);
        assertEquals(List.of(firstSlot()), mine.slots());
        assertEquals(LocalDateTime.of(2030, 1, 1, 0, 0), mine.updatedAt());
    }

    @Test
    void invite_reportsActiveState() {
        AvailabilityInvite invite = invite(3L, sheet(1L, creator), "tok");
        invite.setMaxUses(4);
        invite.setUseCount(1);
        Instant now = Instant.parse("2030-01-01T00:00:00Z");

        InviteResponse active = AvailabilityMapper.invite(invite, now);
        assertEquals(3L, active.inviteId());
        assertEquals("tok", active.token());
        assertEquals(4, active.maxUses());
        assertEquals(1, active.useCount());
        assertTrue(active.active());

        invite.setRevokedAt(now);
        assertFalse(AvailabilityMapper.invite(invite, now).active());
    }
}
