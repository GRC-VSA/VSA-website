package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.model.AvailabilitySlot;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Grid math for availability sheets: which days and rows a sheet has, the UTC instant of every
 * cell, and checking submitted cells against that grid.
 *
 * <p>The backend is the only place that turns (date, local time, sheet time zone) into instants.
 * The frontend just echoes back instants it was given.
 *
 * @author VSA Development Team
 */
public final class AvailabilityGrid {
    private AvailabilityGrid() {}

    /** Every day from dateStart to dateEnd, inclusive. */
    public static List<LocalDate> dates(AvailabilitySheet sheet) {
        List<LocalDate> dates = new ArrayList<>();
        for (LocalDate d = sheet.getDateStart(); !d.isAfter(sheet.getDateEnd()); d = d.plusDays(1)) {
            dates.add(d);
        }
        return dates;
    }

    /** Row start times: dayStartTime, +slot, ... while the row still ends by dayEndTime. */
    public static List<LocalTime> times(AvailabilitySheet sheet) {
        long minutes = Duration.between(sheet.getDayStartTime(), sheet.getDayEndTime()).toMinutes();
        int rows = (int) (minutes / sheet.getSlotMinutes());
        List<LocalTime> times = new ArrayList<>(rows);
        for (int r = 0; r < rows; r++) {
            times.add(sheet.getDayStartTime().plusMinutes((long) r * sheet.getSlotMinutes()));
        }
        return times;
    }

    public static GridResponse build(AvailabilitySheet sheet) {
        ZoneId zone = sheet.zoneId();
        List<LocalDate> dates = dates(sheet);
        List<LocalTime> times = times(sheet);
        List<List<Instant>> slotStarts = new ArrayList<>(dates.size());
        for (LocalDate date : dates) {
            List<Instant> day = new ArrayList<>(times.size());
            for (LocalTime time : times) {
                day.add(ZonedDateTime.of(date, time, zone).toInstant());
            }
            slotStarts.add(day);
        }
        return new GridResponse(dates, times, slotStarts);
    }

    /** All cell instants of a sheet. */
    public static Set<Instant> validSlots(AvailabilitySheet sheet) {
        return build(sheet).slotStarts().stream()
                .flatMap(List::stream)
                .collect(Collectors.toCollection(HashSet::new));
    }

    /**
     * Rejects any instant that is not exactly one of the sheet's cells (wrong day, outside the time
     * range, or not on a slot boundary).
     *
     * @throws IllegalArgumentException naming the first bad slot
     */
    public static void validateSlots(AvailabilitySheet sheet, Collection<Instant> requested) {
        Set<Instant> valid = validSlots(sheet);
        for (Instant slot : requested) {
            if (!valid.contains(slot)) {
                throw new IllegalArgumentException(slot + " is not a time slot on this sheet");
            }
        }
    }

    /**
     * Makes the participant's slots equal to {@code requested}. Only the difference is written:
     * deleting and re-inserting the same (participant, slot) in one flush would hit the unique
     * constraint, because Hibernate runs inserts before deletes. Duplicates in the request collapse,
     * so each cell counts once.
     */
    public static void applySlots(AvailabilityParticipant participant, Collection<Instant> requested) {
        Set<Instant> wanted = new LinkedHashSet<>(requested);
        participant.getSlots().removeIf(slot -> !wanted.contains(slot.getSlotStart()));
        Set<Instant> kept =
                participant.getSlots().stream()
                        .map(AvailabilitySlot::getSlotStart)
                        .collect(Collectors.toSet());
        for (Instant start : wanted) {
            if (!kept.contains(start)) {
                participant.getSlots().add(new AvailabilitySlot(participant, start));
            }
        }
    }

    /** The participant's slots, earliest first. */
    public static List<Instant> sortedSlots(AvailabilityParticipant participant) {
        return participant.getSlots().stream().map(AvailabilitySlot::getSlotStart).sorted().toList();
    }
}
