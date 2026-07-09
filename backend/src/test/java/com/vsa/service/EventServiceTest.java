package com.vsa.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.vsa.model.Event;
import com.vsa.repository.EventRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EventServiceTest {

  @Mock private EventRepository eventRepository;

  @InjectMocks private EventService eventService;

  private Event testEvent;

  @BeforeEach
  public void setup() {
    testEvent = new Event();
    testEvent.setEventName("VSA Mid Autumn Festival");
    testEvent.setTitle("Mid-Autumn Festival 2026");
    testEvent.setDescription("Annual Mid Autumn Festival");
    testEvent.setEventDate(LocalDate.of(2026, 9, 25));
    testEvent.setStartTime(LocalTime.of(17, 0));
    testEvent.setEndTime(LocalTime.of(22, 0));
    testEvent.setCapacity(300);
    testEvent.setMinAge(0);
    testEvent.setLocation("CCA Lounge");
    testEvent.setStatus("upcoming");
  }

  @Test
  void getEventById_returnsEvent_whenFound() {
    Event event = new Event();
    event.setTitle("Club Meeting");

    when(eventRepository.findById(1L)).thenReturn(Optional.of(event));

    Event result = eventService.getEventById(1L);

    assertEquals("Club Meeting", result.getTitle());
  }
}
