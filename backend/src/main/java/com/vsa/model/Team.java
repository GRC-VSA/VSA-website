package com.vsa.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * An officer team (Marketing, Event Organizing, ...). Users point at their team through {@code
 * users.team_id}; tasks keep a snapshot of the assignee's team at the time it was assigned.
 *
 * <p>The relationship is one-directional on purpose: {@code User -> Team}. Nothing needs to walk
 * {@code team.getMembers()}, and a back-reference would only add a second side to keep in sync.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "teams")
public class Team {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "team_id")
  private Long teamId;

  /** Display name. Unique so "Marketing" can only exist once. */
  @Column(nullable = false, unique = true, length = 100)
  private String name;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    this.createdAt = Instant.now();
  }
}
