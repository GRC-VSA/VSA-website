package com.vsa.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Event;
import com.vsa.repository.EventRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
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

  // test getAllEvents
  @Test
  void getAllEvents_returnsListOfEvents() {
    when(eventRepository.findAll()).thenReturn(List.of(testEvent));

    List<Event> result = eventService.getAllEvents();

    assertEquals(1, result.size());
    assertEquals("VSA Mid Autumn Festival", result.get(0).getEventName());
    verify(eventRepository, times(1)).findAll();
  }

  @Test
  void getAllEvents_returnsEmptyList_whenNoEvents() {
    when(eventRepository.findAll()).thenReturn(List.of());

    List<Event> result = eventService.getAllEvents();

    assertTrue(result.isEmpty());
  }

  // test getAllUpcomingEvents
  @Test
  void getAllUpcomingEvents_returnsOnlyUpcomingEvents() {
    when(eventRepository.findByStatus("upcoming")).thenReturn(List.of(testEvent));

    List<Event> result = eventService.getAllUpcomingEvents();

    assertEquals(1, result.size());
    assertEquals("upcoming", result.get(0).getStatus());
    verify(eventRepository, times(1)).findByStatus("upcoming");
  }

  // test getEventById
  @Test
  void getEventById_returnsEvent_whenFound() {
    when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

    Event result = eventService.getEventById(1L);

    assertEquals("Mid-Autumn Festival 2026", result.getTitle());
  }

  @Test
  void getEventById_throwsResourceNotFoundException_whenNotFound() {
    when(eventRepository.findById(99L)).thenReturn(Optional.empty());

    ResourceNotFoundException ex = assertThrows(
            ResourceNotFoundException.class,
            () -> eventService.getEventById(99L)
    );
    assertEquals("Resource with id 99 not found", ex.getMessage());
  }

  //Create event test
  @Test
  void createEvent_savesAndReturnsEvent() {
    when(eventRepository.save(testEvent)).thenReturn(testEvent);

    Event result = eventService.createEvent(testEvent);

    assertNotNull(result);
    assertEquals("VSA Mid Autumn Festival", result.getEventName());
    verify(eventRepository, times(1)).save(testEvent);
  }

  // test updateEvent

  @Test
  void updateEvent_updatesFields_whenFound() {
    Event updatedReq = new Event();
    updatedReq.setEventName("VSA Mid Autumn Festival");
    updatedReq.setTitle("Mid-Autumn Festival 2026");
    updatedReq.setDescription("Annual Mid Autumn Festival");
    updatedReq.setEventDate(LocalDate.of(2026, 8, 20));
    updatedReq.setStartTime(LocalTime.of(18, 0));
    updatedReq.setEndTime(LocalTime.of(21, 0));
    updatedReq.setCapacity(200);
    updatedReq.setMinAge(0);
    updatedReq.setLocation("CCA Lounge");
    updatedReq.setStatus("upcoming");
    updatedReq.setImageUrl("/uploads/culture-night.jpg");

    when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
    when(eventRepository.save(any(Event.class))).thenReturn(testEvent);

    Event result = eventService.updateEvent(1L, updatedReq);

    assertNotNull(result);
    verify(eventRepository, times(1)).findById(1L);
    verify(eventRepository, times(1)).save(testEvent);
  }

  @Test
  void updateEvent_throwsResourceNotFoundException_whenNotFound() {
    when(eventRepository.findById(99L)).thenReturn(Optional.empty());

    assertThrows(
            ResourceNotFoundException.class,
            () -> eventService.updateEvent(99L, testEvent)
    );

    verify(eventRepository, never()).save(any());
  }

  @Test
  void updateEvent_keepsExistingStatus_whenRequestStatusIsNull() {
    Event req = new Event();
    req.setEventName("Updated Name");
    req.setTitle("Updated Title");
    req.setDescription("Updated");
    req.setEventDate(LocalDate.of(2026, 8, 20));
    req.setStartTime(LocalTime.of(18, 0));
    req.setEndTime(LocalTime.of(22, 0));
    req.setCapacity(200);
    req.setMinAge(0);
    req.setLocation("Main Hall");
    req.setStatus(null);       // null — should keep existing
    req.setImageUrl(null);     // null — should keep existing

    testEvent.setStatus("upcoming");
    testEvent.setImageUrl("/uploads/existing.jpg");

    when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
    when(eventRepository.save(any(Event.class))).thenReturn(testEvent);

    eventService.updateEvent(1L, req);

    // existing values should be preserved
    assertEquals("upcoming", testEvent.getStatus());
    assertEquals("/uploads/existing.jpg", testEvent.getImageUrl());
  }

  // test delete

  @Test
  void delete_deletesEvent_whenFound() {
    when(eventRepository.existsById(1L)).thenReturn(true);
    doNothing().when(eventRepository).deleteById(1L);

    assertDoesNotThrow(() -> eventService.delete(1L));

    verify(eventRepository, times(1)).deleteById(1L);
  }

  @Test
  void delete_throwsResourceNotFoundException_whenNotFound() {
    when(eventRepository.existsById(99L)).thenReturn(false);

    assertThrows(
            ResourceNotFoundException.class,
            () -> eventService.delete(99L)
    );

    verify(eventRepository, never()).deleteById(any());
  }
}
