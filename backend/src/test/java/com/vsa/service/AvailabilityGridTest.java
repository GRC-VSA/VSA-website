package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;

import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySlot;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AvailabilityGridTest {

    private final AvailabilitySheet sheet = sheet(1L, user("u1", "Amy", "Lee", "officer"));

    @Test
    void dates_isInclusiveRange() {
        assertEquals(
                List.of(LocalDate.of(2030, 1, 7), LocalDate.of(2030, 1, 8)),
                AvailabilityGrid.dates(sheet));
    }

    @Test
    void times_stepsBySlotAndStopsWhenRowWouldOverrun() {
        assertEquals(
                List.of(
                        LocalTime.of(9, 0), LocalTime.of(9, 30), LocalTime.of(10, 0), LocalTime.of(10, 30)),
                AvailabilityGrid.times(sheet));

        sheet.setSlotMinutes(60);
        assertEquals(List.of(LocalTime.of(9, 0), LocalTime.of(10, 0)), AvailabilityGrid.times(sheet));
    }

    @Test
    void build_convertsLocalTimesToUtcUsingSheetZone() {
        GridResponse grid = AvailabilityGrid.build(sheet);

        assertEquals(2, grid.slotStarts().size());
        assertEquals(4, grid.slotStarts().get(0).size());
        assertEquals(Instant.parse("2030-01-07T17:00:00Z"), grid.slotStarts().get(0).get(0));
        assertEquals(Instant.parse("2030-01-08T18:30:00Z"), grid.slotStarts().get(1).get(3));
    }

    @Test
    void build_respectsDaylightSavingOffset() {
        sheet.setDateStart(LocalDate.of(2030, 7, 1));
        sheet.setDateEnd(LocalDate.of(2030, 7, 1));

        assertEquals(
                Instant.parse("2030-07-01T16:00:00Z"), AvailabilityGrid.build(sheet).slotStarts().get(0).get(0));
    }

    @Test
    void validSlots_containsEveryCell() {
        Set<Instant> valid = AvailabilityGrid.validSlots(sheet);
        assertEquals(8, valid.size());
        assertTrue(valid.contains(firstSlot()));
    }

    @Test
    void validateSlots_acceptsValidAndEmpty() {
        assertDoesNotThrow(() -> AvailabilityGrid.validateSlots(sheet, List.of(firstSlot())));
        assertDoesNotThrow(() -> AvailabilityGrid.validateSlots(sheet, List.of()));
    }

    @Test
    void validateSlots_rejectsOffGridInstant() {
        Instant bad = Instant.parse("2030-01-07T17:15:00Z");
        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> AvailabilityGrid.validateSlots(sheet, List.of(firstSlot(), bad)));
        assertTrue(ex.getMessage().contains(bad.toString()));
    }

    @Test
    void applySlots_addsNewCollapsesDuplicatesAndDropsUnwanted() {
        AvailabilityParticipant p = officerEntry(1L, sheet, sheet.getCreatedBy());
        Instant a = firstSlot();
        Instant b = a.plusSeconds(1800);
        Instant c = a.plusSeconds(3600);

        AvailabilityGrid.applySlots(p, List.of(a, b, b));
        assertEquals(List.of(a, b), AvailabilityGrid.sortedSlots(p));

        AvailabilitySlot keptA = p.getSlots().stream().filter(s -> s.getSlotStart().equals(a)).findFirst().orElseThrow();
        AvailabilityGrid.applySlots(p, List.of(a, c));

        assertEquals(List.of(a, c), AvailabilityGrid.sortedSlots(p));
        assertTrue(p.getSlots().contains(keptA), "unchanged slot must be kept, not re-created");
    }

    @Test
    void applySlots_emptyClearsEverything() {
        AvailabilityParticipant p = officerEntry(1L, sheet, sheet.getCreatedBy());
        AvailabilityGrid.applySlots(p, List.of(firstSlot()));
        AvailabilityGrid.applySlots(p, List.of());
        assertTrue(p.getSlots().isEmpty());
    }

    @Test
    void sortedSlots_earliestFirst() {
        AvailabilityParticipant p = officerEntry(1L, sheet, sheet.getCreatedBy());
        Instant a = firstSlot();
        p.getSlots().add(new AvailabilitySlot(p, a.plusSeconds(1800)));
        p.getSlots().add(new AvailabilitySlot(p, a));
        assertEquals(List.of(a, a.plusSeconds(1800)), AvailabilityGrid.sortedSlots(p));
    }
}
