package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vsa.model.Event;
import com.vsa.service.EventService;
import com.vsa.service.FileStorageService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class EventControllerTest {

  @Mock private EventService eventService;
  @Mock private FileStorageService fileStorageService;

  @InjectMocks private EventController eventController;

  @Test
  void getEvents_ReturnsList() {
    List<Event> mockEvents = List.of(new Event(), new Event());
    when(eventService.getAllEvents()).thenReturn(mockEvents);

    ResponseEntity<List<Event>> response = eventController.getEvents();

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(2, response.getBody().size());
    verify(eventService).getAllEvents();
  }

  @Test
  void getEventById_ValidId_ReturnsEvent() {
    Long eventId = 1L;
    Event mockEvent = new Event();
    when(eventService.getEventById(eventId)).thenReturn(mockEvent);

    ResponseEntity<Event> response = eventController.getEventById(eventId);

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(mockEvent, response.getBody());
    verify(eventService).getEventById(eventId);
  }

  @Test
  void createEvent_WithImage_SavesImageAndCreatesEvent() {
    Event inputEvent = new Event();
    MockMultipartFile image =
            new MockMultipartFile("image", "poster.jpg", "image/jpeg", "image content".getBytes());

    when(fileStorageService.save(image)).thenReturn("/uploads/unique_poster.jpg");
    when(eventService.createEvent(any(Event.class))).thenAnswer(i -> i.getArgument(0));

    ResponseEntity<Event> response = eventController.createEvent(inputEvent, image);

    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals("/uploads/unique_poster.jpg", response.getBody().getImageUrl());
    verify(fileStorageService).save(image);
    verify(eventService).createEvent(inputEvent);
  }

  @Test
  void createEvent_WithoutImage_CreatesEventOnly() {
    Event inputEvent = new Event();

    when(eventService.createEvent(inputEvent)).thenReturn(inputEvent);

    ResponseEntity<Event> response = eventController.createEvent(inputEvent, null);

    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    verify(fileStorageService, never()).save(any());
    verify(eventService).createEvent(inputEvent);
  }

  @Test
  void createEventJson_CreatesEvent() {
    Event inputEvent = new Event();
    when(eventService.createEvent(inputEvent)).thenReturn(inputEvent);

    ResponseEntity<Event> response = eventController.createEventJson(inputEvent);

    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertEquals(inputEvent, response.getBody());
    verify(eventService).createEvent(inputEvent);
  }

  @Test
  void updateEvent_WithImage_SavesImageAndUpdatesEvent() {
    Long eventId = 1L;
    Event inputEvent = new Event();
    MockMultipartFile image =
            new MockMultipartFile("image", "new_poster.jpg", "image/jpeg", "new image content".getBytes());

    when(fileStorageService.save(image)).thenReturn("/uploads/updated_poster.jpg");
    when(eventService.updateEvent(eq(eventId), any(Event.class)))
            .thenAnswer(i -> i.getArgument(1));

    ResponseEntity<Event> response = eventController.updateEvent(eventId, inputEvent, image);

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals("/uploads/updated_poster.jpg", response.getBody().getImageUrl());
    verify(fileStorageService).save(image);
    verify(eventService).updateEvent(eventId, inputEvent);
  }

  @Test
  void updateEvent_WithoutImage_UpdatesEventOnly() {
    Long eventId = 1L;
    Event inputEvent = new Event();

    when(eventService.updateEvent(eventId, inputEvent)).thenReturn(inputEvent);

    ResponseEntity<Event> response = eventController.updateEvent(eventId, inputEvent, null);

    assertEquals(HttpStatus.OK, response.getStatusCode());
    verify(fileStorageService, never()).save(any());
    verify(eventService).updateEvent(eventId, inputEvent);
  }

  @Test
  void deleteEvent_ReturnsNoContent() {
    Long eventId = 1L;
    doNothing().when(eventService).delete(eventId);

    ResponseEntity<Event> response = eventController.deleteEvent(eventId);

    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    verify(eventService).delete(eventId);
  }
}