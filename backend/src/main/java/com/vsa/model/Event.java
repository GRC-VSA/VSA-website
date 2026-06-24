package com.vsa.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    // "sport", "field trip", "club meeting"
    @Column(nullable = false)
    private String category;

    private boolean ongoing;

    // Which VSA generation hosted this event (e.g. "Gen 6", "Gen 7")
    private String vsaGen;

}
