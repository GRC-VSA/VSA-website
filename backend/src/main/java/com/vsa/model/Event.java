package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing an Event managed by VSA.
 *
 * <p>Contains all details for events including date, time, capacity, and status. Automatically sets
 * creation timestamp on persistence.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "events")
public class Event {
  // ── Primary Key ────────────────────────────────────────────
  /** Unique identifier for the event (auto-generated) */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "event_id")
  private Long eventId;

  // ── Basic Information ──────────────────────────────────────
  /** Internal name of the event */
  @Column(name = "event_name", nullable = false)
  private String eventName;

  /** Display title of the event */
  @Column(nullable = false)
  private String title;

  /** Detailed description of the event */
  private String description;

  // ── Date & Time Information ────────────────────────────────
  /** Date when the event occurs */
  @Column(name = "event_date", nullable = false)
  private LocalDate eventDate;

  /** Start time of the event */
  @Column(name = "start_time", nullable = false)
  private LocalTime startTime;

  /** End time of the event */
  @Column(name = "end_time", nullable = false)
  private LocalTime endTime;

  // ── Event Details ──────────────────────────────────────────
  /** Maximum number of attendees allowed */
  @Column(nullable = false)
  private int capacity;

  /** Minimum age requirement for attendees (default: 0) */
  @Column(name = "min_age", nullable = false)
  private int minAge = 0;

  /** Physical location where the event will be held */
  private String location;

  /** Current status of the event: "upcoming", "ongoing", or "archived" (default: "upcoming") */
  private String status = "upcoming";

  // ── Media & Metadata ───────────────────────────────────────
  /** URL to the event's image/poster */
  @Column(name = "image_url")
  private String imageUrl;

  /** Timestamp when the event was created in the database (auto-set on creation) */
  @Column(name = "created_at")
  private LocalDateTime createdAt;

  /** Automatically sets the creation timestamp before persisting the entity. */
  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
