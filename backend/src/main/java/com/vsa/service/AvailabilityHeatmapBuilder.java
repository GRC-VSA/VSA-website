package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.controller.AvailabilityDtos.HeatmapResponse;
import com.vsa.model.AvailabilitySheet;
import com.vsa.repository.AvailabilitySlotRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Builds the anonymous heatmap: for each cell, how many people are free. Who picked which cell
 * never leaves the database.
 *
 * @author VSA Development Team
 */
@Component
public class AvailabilityHeatmapBuilder {

    /**
     * The heatmap stays hidden until this many people have answered. With one or two responders,
     * counts plus the responder list would show exactly who is free when.
     */
    public static final int MIN_RESPONDERS = 3;

    private final AvailabilitySlotRepository slotRepository;

    public AvailabilityHeatmapBuilder(AvailabilitySlotRepository slotRepository) {
        this.slotRepository = slotRepository;
    }

    public HeatmapResponse build(AvailabilitySheet sheet, GridResponse grid, long responderCount) {
        int responders = (int) responderCount;
        if (responders < MIN_RESPONDERS) {
            return new HeatmapResponse(false, responders, MIN_RESPONDERS, 0, null);
        }

        Map<Instant, Integer> perSlot = new HashMap<>();
        for (Object[] row : slotRepository.countPeoplePerSlot(sheet.getSheetId())) {
            perSlot.put((Instant) row[0], ((Number) row[1]).intValue());
        }

        int max = 0;
        List<List<Integer>> counts = new ArrayList<>(grid.slotStarts().size());
        for (List<Instant> day : grid.slotStarts()) {
            List<Integer> column = new ArrayList<>(day.size());
            for (Instant start : day) {
                int count = perSlot.getOrDefault(start, 0);
                column.add(count);
                max = Math.max(max, count);
            }
            counts.add(column);
        }
        return new HeatmapResponse(true, responders, MIN_RESPONDERS, max, counts);
    }
}
