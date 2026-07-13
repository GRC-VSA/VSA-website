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

@RestController
@RequestMapping("/api/events")
public class EventController {
  private final EventService eventService;
  private final FileStorageService fileStorageService;

  public EventController(EventService eventService, FileStorageService fileStorageService) {
    this.eventService = eventService;
    this.fileStorageService = fileStorageService;
  }

  @GetMapping
  public ResponseEntity<List<Event>> getEvents() {
    return ResponseEntity.ok(eventService.getAllEvents());
  }

  @GetMapping({"/{id}"})
  public ResponseEntity<Event> getEventById(@PathVariable Long id) {
    return ResponseEntity.ok(eventService.getEventById(id));
  }

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

  //When no image is provided, the event can be created using JSON directly. This endpoint allows for that.
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Event> createEventJson(@RequestBody Event event) {
    return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event));
  }

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

  @DeleteMapping("/{id}")
  public ResponseEntity<Event> deleteEvent(@PathVariable Long id) {
    eventService.delete(id);
    return ResponseEntity.noContent().build(); // 204 No Content
  }
}
