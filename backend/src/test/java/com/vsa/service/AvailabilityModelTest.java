package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;

import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySheet.Status;
import com.vsa.model.AvailabilitySlot;
import com.vsa.model.User;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class AvailabilityModelTest {

    private final User creator = user("u1", "Amy", "Lee", "officer");
    private final Instant now = Instant.parse("2030-01-01T00:00:00Z");

    @Test
    void sheet_isOpenAt_coversStatusAndDeadline() {
        AvailabilitySheet sheet = sheet(1L, creator);
        assertTrue(sheet.isOpenAt(now));

        sheet.setClosesAt(now.plusSeconds(1));
        assertTrue(sheet.isOpenAt(now));
        sheet.setClosesAt(now);
        assertFalse(sheet.isOpenAt(now));

        sheet.setClosesAt(null);
        sheet.setStatus(Status.CLOSED);
        assertFalse(sheet.isOpenAt(now));
    }

    @Test
    void sheet_defaultsAndZone() {
        AvailabilitySheet sheet = new AvailabilitySheet();
        assertEquals(30, sheet.getSlotMinutes());
        assertEquals(Status.OPEN, sheet.getStatus());
        assertEquals(ZoneId.of("America/Los_Angeles"), sheet.zoneId());
    }

    @Test
    void sheet_lifecycleCallbacksStampTimes() throws InterruptedException {
        AvailabilitySheet sheet = new AvailabilitySheet();
        sheet.prePersist();
        assertNotNull(sheet.getCreatedAt());
        assertEquals(sheet.getCreatedAt(), sheet.getUpdatedAt());
        Thread.sleep(2);
        sheet.preUpdate();
        assertTrue(sheet.getUpdatedAt().isAfter(sheet.getCreatedAt()));
    }

    @Test
    void invite_activeAndUsesLeft() {
        AvailabilityInvite invite = invite(1L, sheet(1L, creator), "t");
        assertTrue(invite.isActiveAt(now));
        assertTrue(invite.hasUsesLeft());

        invite.setExpiresAt(now.plusSeconds(1));
        assertTrue(invite.isActiveAt(now));
        invite.setExpiresAt(now);
        assertFalse(invite.isActiveAt(now));

        invite.setExpiresAt(null);
        invite.setRevokedAt(now);
        assertFalse(invite.isActiveAt(now));

        invite.setMaxUses(2);
        invite.setUseCount(1);
        assertTrue(invite.hasUsesLeft());
        invite.setUseCount(2);
        assertFalse(invite.hasUsesLeft());

        invite.prePersist();
        assertNotNull(invite.getCreatedAt());
    }

    @Test
    void participant_guestVsOfficerIdentity() {
        AvailabilitySheet sheet = sheet(1L, creator);
        AvailabilityParticipant officer = officerEntry(1L, sheet, creator);
        AvailabilityParticipant guest = guestEntry(2L, sheet, "Bob");

        assertFalse(officer.isGuest());
        assertEquals("Amy Lee", officer.displayName());
        assertTrue(guest.isGuest());
        assertEquals("Bob", guest.displayName());

        guest.prePersist();
        assertNotNull(guest.getSubmittedAt());
        assertEquals(guest.getSubmittedAt(), guest.getUpdatedAt());
    }

    @Test
    void slot_constructorSetsFields() {
        AvailabilityParticipant p = guestEntry(1L, sheet(1L, creator), "Bob");
        AvailabilitySlot slot = new AvailabilitySlot(p, now);
        assertSame(p, slot.getParticipant());
        assertEquals(now, slot.getSlotStart());
        assertNull(new AvailabilitySlot().getSlotStart());
    }
}
