package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "application_roles")
public class ApplicationRole {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "application_role_id")
  private Long applicationRoleId;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false)
  private boolean recruiting;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ApplicationRoleStatus status = ApplicationRoleStatus.UNFINISHED;

  @OneToMany(mappedBy = "applicationRole", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("sectionNumber ASC")
  private List<ApplicationSection> sections = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
