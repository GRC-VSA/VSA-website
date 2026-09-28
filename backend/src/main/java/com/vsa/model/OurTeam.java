package com.vsa.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "our_team")
@Getter
@Setter
public class OurTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "our_team_id")
    private Long ourTeamId;

    @Column(name = "generation", nullable = false)
    private Integer generation;

    @Column(name = "officer_name", nullable = false, length = 150)
    private String officerName;

    @Column(name = "officer_position", nullable = false, length = 150)
    private String officerPosition;

    @Column(name = "officer_image", nullable = false, columnDefinition = "TEXT")
    private String officerImage;

    @Column(name = "officer_quote", nullable = false, columnDefinition = "TEXT")
    private String officerQuote;

    @Column(name = "officer_instagram_url", columnDefinition = "TEXT")
    private String officerInstagramUrl;

    @Column(name = "officer_linkedin_url", columnDefinition = "TEXT")
    private String officerLinkedinUrl;

    @Column(name = "officer_email", length = 320)
    private String officerEmail;
}