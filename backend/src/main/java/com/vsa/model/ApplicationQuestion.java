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
@Table(name = "application_questions")
public class ApplicationQuestion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "question_id")
  private Long questionId;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String prompt;

  @Column(nullable = false)
  private boolean required;

  @Enumerated(EnumType.STRING)
  @Column(name = "response_type", nullable = false)
  private QuestionResponseType responseType = QuestionResponseType.LONG_TEXT;

  @Column(name = "question_number", nullable = false)
  private int questionNumber;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "section_id", nullable = false)
  private ApplicationSection section;
}
