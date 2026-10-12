package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.controller.AvailabilityDtos.HeatmapResponse;
import com.vsa.model.AvailabilitySheet;
import com.vsa.repository.AvailabilitySlotRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class AvailabilityHeatmapBuilderTest {

    private final AvailabilitySlotRepository slotRepository = mock(AvailabilitySlotRepository.class);
    private final AvailabilityHeatmapBuilder builder = new AvailabilityHeatmapBuilder(slotRepository);
    private final AvailabilitySheet sheet = sheet(1L, user("u1", "Amy", "Lee", "officer"));
    private final GridResponse grid = AvailabilityGrid.build(sheet);

    @Test
    void build_belowThresholdHidesCountsAndSkipsQuery() {
        HeatmapResponse result = builder.build(sheet, grid, 2);

        assertFalse(result.visible());
        assertEquals(2, result.responderCount());
        assertEquals(AvailabilityHeatmapBuilder.MIN_RESPONDERS, result.minResponders());
        assertNull(result.counts());
        verifyNoInteractions(slotRepository);
    }

    @Test
    void build_atThresholdCountsPerCellAndTracksMax() {
        Object[] first = {firstSlot(), 3L};
        Object[] second = {firstSlot().plusSeconds(1800), 1};
        when(slotRepository.countPeoplePerSlot(1L)).thenReturn(List.of(first, second));

        HeatmapResponse result = builder.build(sheet, grid, 3);

        assertTrue(result.visible());
        assertEquals(3, result.maxCount());
        assertEquals(List.of(3, 1, 0, 0), result.counts().get(0));
        assertEquals(List.of(0, 0, 0, 0), result.counts().get(1));
    }

    @Test
    void build_ignoresSlotsOutsideGrid() {
        Object[] stray = {firstSlot().plusSeconds(999_999), 5L};
        when(slotRepository.countPeoplePerSlot(1L)).thenReturn(java.util.Collections.singletonList(stray));

        HeatmapResponse result = builder.build(sheet, grid, 5);

        assertEquals(0, result.maxCount());
    }
}
