package com.vsa.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "application_sections")
public class ApplicationSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "section_heading", nullable = false)
    private String sectionHeading;

    @Column(name = "section_description", columnDefinition = "TEXT")
    private String sectionDescription;

    @Column(name = "system_key", length = 100)
    private String systemKey;

    @OneToMany(
        mappedBy = "section",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @OrderBy("orderNum ASC")
    private List<ApplicationQuestion> questions = new ArrayList<>();

    @JsonIgnore
    @OneToMany(
        mappedBy = "section",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<ApplicationSectionRole> sectionRoles = new ArrayList<>();
}