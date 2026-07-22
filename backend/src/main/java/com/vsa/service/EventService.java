package com.vsa.service;

import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Event;
import com.vsa.repository.EventRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for managing Event operations.
 *
 * <p>Handles business logic for CRUD operations on events, including filtering by status and
 * updating event details with transaction support.
 *
 * @author VSA Development Team
 */
@Service
public class EventService {
  // ── Dependencies ──────────────────────────────────────────
  private final EventRepository eventRepository;

  /**
   * Constructs an EventService with required dependencies.
   *
   * @param eventRepository Repository for event data access
   */
  @Autowired
  public EventService(EventRepository eventRepository) {
    this.eventRepository = eventRepository;
  }

  // ── Read Operations ────────────────────────────────────────

  /**
   * Retrieves all events from the database.
   *
   * @return List of all events
   */
  public List<Event> getAllEvents() {
    return eventRepository.findAll();
  }

  /**
   * Retrieves all upcoming events.
   *
   * @return List of events with status "upcoming"
   */
  public List<Event> getAllUpcomingEvents() {
    return eventRepository.findByStatus("upcoming");
  }

  /**
   * Retrieves a specific event by ID.
   *
   * @param id The event ID
   * @return The requested event
   * @throws ResourceNotFoundException If the event is not found
   */
  public Event getEventById(Long id) {
    return eventRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Event", id));
  }

  // ── Create Operations ──────────────────────────────────────

  /**
   * Creates a new event in the database.
   *
   * @param event The event to create
   * @return The created event with ID generated
   */
  public Event createEvent(Event event) {
    return eventRepository.save(event);
  }

  // ── Update Operations ──────────────────────────────────────

  /**
   * Updates an existing event with new details.
   *
   * <p>Only updates the provided fields. Uses transaction support to ensure consistency.
   *
   * @param id The ID of the event to update
   * @param req The event details to update
   * @return The updated event
   * @throws ResourceNotFoundException If the event is not found
   */
  @Transactional
  public Event updateEvent(Long id, Event req) {
    Event existing =
        eventRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event", id));

    existing.setEventName(req.getEventName());
    existing.setTitle(req.getTitle());
    existing.setDescription(req.getDescription());
    existing.setEventDate(req.getEventDate());
    existing.setStartTime(req.getStartTime());
    existing.setEndTime(req.getEndTime());
    existing.setCapacity(req.getCapacity());
    existing.setMinAge(req.getMinAge());
    existing.setLocation(req.getLocation());
    existing.setStatus(req.getStatus() != null ? req.getStatus() : existing.getStatus());
    existing.setImageUrl(req.getImageUrl() != null ? req.getImageUrl() : existing.getImageUrl());

    return eventRepository.save(existing);
  }

  // ── Delete Operations ──────────────────────────────────────

  /**
   * Deletes an event by ID.
   *
   * <p>Uses transaction support to ensure consistency.
   *
   * @param id The ID of the event to delete
   * @throws ResourceNotFoundException If the event is not found
   */
  @Transactional
  public void delete(Long id) {
    if (!eventRepository.existsById(id)) {
      throw new ResourceNotFoundException("Event", id);
    }
    eventRepository.deleteById(id);
  }
}
