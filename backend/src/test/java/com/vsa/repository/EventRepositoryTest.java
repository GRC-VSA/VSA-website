package com.vsa.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vsa.model.Event;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class EventRepositoryTest {

    @Autowired private EventRepository eventRepository;

    @Test
    void findByStatus_ReturnsMatchingEvents() {
        Event event1 = createEvent("Event 1", "upcoming");
        Event event2 = createEvent("Event 2", "upcoming");
        Event event3 = createEvent("Event 3", "archived");

        eventRepository.save(event1);
        eventRepository.save(event2);
        eventRepository.save(event3);

        List<Event> upcomingEvents = eventRepository.findByStatus("upcoming");

        assertEquals(2, upcomingEvents.size());
        assertTrue(upcomingEvents.stream().allMatch(e -> "upcoming".equals(e.getStatus())));
    }

    private Event createEvent(String title, String status) {
        Event event = new Event();
        event.setEventName(title);
        event.setTitle(title);
        event.setEventDate(LocalDate.now().plusDays(1));
        event.setStartTime(LocalTime.of(18, 0));
        event.setEndTime(LocalTime.of(20, 0));
        event.setCapacity(50);
        event.setStatus(status);
        return event;
    }
}