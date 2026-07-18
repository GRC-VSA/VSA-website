package com.vsa.controller;

import com.vsa.model.Event;
import com.vsa.service.EventService;
import com.vsa.service.FileStorageService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for managing Event operations.
 *
 * <p>Provides endpoints for retrieving, creating, updating, and deleting events. Supports file
 * uploads for event images in multipart/form-data format.
 *
 * <p>Base endpoint: /api/events
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/events")
public class EventController {
  // ── Dependencies ──────────────────────────────────────────
  private final EventService eventService;
  private final FileStorageService fileStorageService;

  /**
   * Constructs an EventController with required dependencies.
   *
   * @param eventService Service for event operations
   * @param fileStorageService Service for file storage operations
   */
  public EventController(EventService eventService, FileStorageService fileStorageService) {
    this.eventService = eventService;
    this.fileStorageService = fileStorageService;
  }

  // ── GET Endpoints ──────────────────────────────────────────

  /**
   * Retrieves all events.
   *
   * @return ResponseEntity containing a list of all events
   */
  @GetMapping
  public ResponseEntity<List<Event>> getEvents() {
    return ResponseEntity.ok(eventService.getAllEvents());
  }

  /**
   * Retrieves a specific event by ID.
   *
   * @param id The event ID
   * @return ResponseEntity containing the requested event
   */
  @GetMapping({"/{id}"})
  public ResponseEntity<Event> getEventById(@PathVariable Long id) {
    return ResponseEntity.ok(eventService.getEventById(id));
  }

  // ── POST Endpoints ────────────────────────────────────────

  /**
   * Creates a new event with multipart form data (including optional image).
   *
   * <p>When an image file is provided, it will be stored and the image URL will be set on the
   * event.
   *
   * @param event The event details
   * @param image Optional image file for the event
   * @return ResponseEntity with status 201 (Created) and the created event
   */
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Event> createEvent(
      @RequestPart("event") Event event,
      @RequestPart(value = "image", required = false) MultipartFile image) {

    if (image != null && !image.isEmpty()) {
      String imageUrl = fileStorageService.save(image);
      event.setImageUrl(imageUrl);
    }

    return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event));
  }

  /**
   * Creates a new event using JSON format (no image).
   *
   * <p>Use this endpoint when no image is provided. The event will be created using JSON directly.
   *
   * @param event The event details in JSON format
   * @return ResponseEntity with status 201 (Created) and the created event
   */
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Event> createEventJson(@RequestBody Event event) {
    return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event));
  }

  // ── PUT Endpoints ──────────────────────────────────────────

  /**
   * Updates an existing event with multipart form data (including optional new image).
   *
   * <p>If a new image is provided, it will replace the old one.
   *
   * @param id The event ID to update
   * @param event The updated event details
   * @param image Optional new image file for the event
   * @return ResponseEntity containing the updated event
   */
  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Event> updateEvent(
      @PathVariable Long id,
      @RequestPart("event") Event event,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    if (image != null && !image.isEmpty()) {
      String imageUrl = fileStorageService.save(image);
      event.setImageUrl(imageUrl);
    }

    return ResponseEntity.ok(eventService.updateEvent(id, event));
  }

  // ── DELETE Endpoints ───────────────────────────────────────

  /**
   * Deletes an event by ID.
   *
   * @param id The event ID to delete
   * @return ResponseEntity with status 204 (No Content)
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Event> deleteEvent(@PathVariable Long id) {
    eventService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
