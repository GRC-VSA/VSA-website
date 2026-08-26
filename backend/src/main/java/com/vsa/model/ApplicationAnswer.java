package com.vsa.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(
    name = "application_answers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"applicant_id", "question_id"}))
public class ApplicationAnswer {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "answer_id")
  private Long answerId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "applicant_id", nullable = false)
  private Applicant applicant;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "question_id", nullable = false)
  private ApplicationQuestion question;

  @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
  private String answerText;
}
