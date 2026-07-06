package com.vsa.service;

import com.vsa.model.Event;
import com.vsa.repository.EventRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

  private final EventRepository eventRepository;

  @Autowired
  public EventService(EventRepository eventRepository) {
    this.eventRepository = eventRepository;
  }

  public List<Event> getAllEvents() {
    return eventRepository.findAll();
  }

  public List<Event> getAllUpcomingEvents() {
    return eventRepository.findByStatus("upcoming");
  }

  public Event getEventById(Long id) {
    return eventRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Event with id " + id + " not found"));
  }

  public Event createEvent(Event event) {
    return eventRepository.save(event);
  }

  @Transactional
  public Event updateEvent(Long id, Event req) {
    Event existing =
        eventRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Event with id " + id + " not found"));

    existing.setEventName(req.getEventName());
    existing.setTitle(req.getTitle());
    existing.setDescription(req.getDescription());
    existing.setEventDate(req.getEventDate());
    existing.setStartTime(req.getStartTime());
    existing.setEndTime(req.getEndTime());
    existing.setCapacity(req.getCapacity());
    existing.setMinAge(req.getMinAge() != 0 ? req.getMinAge() : existing.getMinAge());
    existing.setLocation(req.getLocation());
    existing.setStatus(req.getStatus() != null ? req.getStatus() : existing.getStatus());
    existing.setImageUrl(req.getImageUrl() != null ? req.getImageUrl() : existing.getImageUrl());

    return eventRepository.save(existing);
  }

  @Transactional
  public void delete(Long id) {
    if (!eventRepository.existsById(id)) {
      throw new IllegalArgumentException("Event with id " + id + " not found");
    }
    eventRepository.deleteById(id);
  }
}
