package com.vsa.model;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "application_section_roles")
public class ApplicationSectionRole {

    @EmbeddedId
    private ApplicationSectionRoleId id = new ApplicationSectionRoleId();

    @JsonIgnore
    @MapsId("applicationRoleId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_role_id", nullable = false)
    private ApplicationRole applicationRole;

    @JsonIgnore
    @MapsId("sectionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private ApplicationSection section;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;


    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    @Embeddable
    public static class ApplicationSectionRoleId
            implements Serializable {

        @Column(name = "application_role_id")
        private Long applicationRoleId;

        @Column(name = "section_id")
        private Long sectionId;
    }
}