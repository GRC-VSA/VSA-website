package com.vsa.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Event;
import com.vsa.service.EventService;
import com.vsa.service.FileStorageService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EventController.class)
class EventControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private tools.jackson.databind.ObjectMapper objectMapper;

  @MockitoBean private EventService eventService;

  @MockitoBean private FileStorageService fileStorageService;

  private Event sampleEvent;

  @BeforeEach
  void setUp() {
    sampleEvent = new Event();
    sampleEvent.setEventName("VSA Night Market");
    sampleEvent.setTitle("Night Market 2026");
    sampleEvent.setDescription("Annual night market");
    sampleEvent.setEventDate(LocalDate.of(2026, 7, 15));
    sampleEvent.setStartTime(LocalTime.of(17, 0));
    sampleEvent.setEndTime(LocalTime.of(21, 0));
    sampleEvent.setCapacity(300);
    sampleEvent.setMinAge(0);
    sampleEvent.setLocation("Student Union Hall");
    sampleEvent.setStatus("upcoming");
  }

  // ── GET /api/events ───────────────────────────────────────────

  @Test
  void getEvents_returns200_withListOfEvents() throws Exception {
    when(eventService.getAllEvents()).thenReturn(List.of(sampleEvent));

    mockMvc
        .perform(get("/api/events"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].eventName").value("VSA Night Market"));
  }

  @Test
  void getEvents_returns200_withEmptyList() throws Exception {
    when(eventService.getAllEvents()).thenReturn(List.of());

    mockMvc
        .perform(get("/api/events"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
  }

  // ── GET /api/events/{id} ──────────────────────────────────────

  @Test
  void getEventById_returns200_whenFound() throws Exception {
    when(eventService.getEventById(1L)).thenReturn(sampleEvent);

    mockMvc
        .perform(get("/api/events/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventName").value("VSA Night Market"))
        .andExpect(jsonPath("$.status").value("upcoming"));
  }

  @Test
  void getEventById_returns404_whenNotFound() throws Exception {
    when(eventService.getEventById(99L)).thenThrow(new ResourceNotFoundException("Event", 99L));

    mockMvc.perform(get("/api/events/99")).andExpect(status().isNotFound());
  }

  // ── POST /api/events ──────────────────────────────────────────

  @Test
  void createEvent_returns201_withoutImage() throws Exception {
    when(eventService.createEvent(any(Event.class))).thenReturn(sampleEvent);

    // event JSON part
    MockMultipartFile eventPart =
        new MockMultipartFile(
            "event",
            "",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsBytes(sampleEvent));

    mockMvc
        .perform(multipart("/api/events").file(eventPart))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.eventName").value("VSA Night Market"));

    verify(fileStorageService, never()).save(any());
  }

  @Test
  void createEvent_returns201_withImage() throws Exception {
    when(fileStorageService.save(any())).thenReturn("/uploads/test.jpg");
    when(eventService.createEvent(any(Event.class))).thenReturn(sampleEvent);

    MockMultipartFile eventPart =
        new MockMultipartFile(
            "event",
            "",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsBytes(sampleEvent));

    MockMultipartFile imagePart =
        new MockMultipartFile(
            "image", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "fake-image-content".getBytes());

    mockMvc
        .perform(multipart("/api/events").file(eventPart).file(imagePart))
        .andExpect(status().isCreated());

    verify(fileStorageService, times(1)).save(any());
  }

  // ── PUT /api/events/{id} ──────────────────────────────────────

  @Test
  void updateEvent_returns200_withoutImage() throws Exception {
    when(eventService.updateEvent(eq(1L), any(Event.class))).thenReturn(sampleEvent);

    MockMultipartFile eventPart =
        new MockMultipartFile(
            "event",
            "",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsBytes(sampleEvent));

    // PUT with multipart needs this workaround
    mockMvc
        .perform(
            multipart("/api/events/1")
                .file(eventPart)
                .with(
                    request -> {
                      request.setMethod("PUT");
                      return request;
                    }))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventName").value("VSA Night Market"));

    verify(fileStorageService, never()).save(any());
  }

  @Test
  void updateEvent_returns200_withImage() throws Exception {
    when(fileStorageService.save(any())).thenReturn("/uploads/updated.jpg");
    when(eventService.updateEvent(eq(1L), any(Event.class))).thenReturn(sampleEvent);

    MockMultipartFile eventPart =
        new MockMultipartFile(
            "event",
            "",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsBytes(sampleEvent));

    MockMultipartFile imagePart =
        new MockMultipartFile(
            "image", "updated.jpg", MediaType.IMAGE_JPEG_VALUE, "fake-image-content".getBytes());

    mockMvc
        .perform(
            multipart("/api/events/1")
                .file(eventPart)
                .file(imagePart)
                .with(
                    request -> {
                      request.setMethod("PUT");
                      return request;
                    }))
        .andExpect(status().isOk());

    verify(fileStorageService, times(1)).save(any());
  }

  @Test
  void updateEvent_returns404_whenNotFound() throws Exception {
    when(eventService.updateEvent(eq(99L), any(Event.class)))
        .thenThrow(new ResourceNotFoundException("Event", 99L));

    MockMultipartFile eventPart =
        new MockMultipartFile(
            "event",
            "",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsBytes(sampleEvent));

    mockMvc
        .perform(
            multipart("/api/events/99")
                .file(eventPart)
                .with(
                    request -> {
                      request.setMethod("PUT");
                      return request;
                    }))
        .andExpect(status().isNotFound());
  }

  // ── DELETE /api/events/{id} ───────────────────────────────────

  @Test
  void deleteEvent_returns204_whenFound() throws Exception {
    doNothing().when(eventService).delete(1L);

    mockMvc.perform(delete("/api/events/1")).andExpect(status().isNoContent());

    verify(eventService, times(1)).delete(1L);
  }

  @Test
  void deleteEvent_returns404_whenNotFound() throws Exception {
    doThrow(new ResourceNotFoundException("Event", 99L)).when(eventService).delete(99L);

    mockMvc.perform(delete("/api/events/99")).andExpect(status().isNotFound());
  }
}
