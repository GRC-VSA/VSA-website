package com.vsa.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class EventTest {

    @Test
    void prePersist_SetsCreatedAt() {
        Event event = new Event();
        event.prePersist();

        assertNotNull(event.getCreatedAt());
    }

    @Test
    void eventDefaults() {
        Event event = new Event();
        assertEquals(0, event.getMinAge());
        assertEquals("upcoming", event.getStatus());
    }
}