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
@Table(
    name = "applicants",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "application_roles_id"}))
public class Applicant {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "applicant_id")
  private Long applicantId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "application_roles_id", nullable = false)
  private ApplicationRole applicationRole;

  @Column(name = "preferred_name")
  private String preferredName;

  private String pronouns;
  private String phone;

  @Column(name = "academic_program", nullable = false)
  private String academicProgram;

  @Column(name = "year_of_study", nullable = false)
  private String yearOfStudy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ApplicantStatus status = ApplicantStatus.SUBMITTED;

  @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ApplicationAnswer> answers = new ArrayList<>();

  @Column(name = "submitted_at", nullable = false, updatable = false)
  private LocalDateTime submittedAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  void onCreate() {
    submittedAt = LocalDateTime.now();
    updatedAt = submittedAt;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
