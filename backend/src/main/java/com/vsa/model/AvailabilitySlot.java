package com.vsa.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing one grid cell a participant marked as free. The slot's end is derived from
 * the sheet's slot length and is not stored.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "availability_slots")
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Long slotId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private AvailabilityParticipant participant;

    @Column(name = "slot_start", nullable = false)
    private Instant slotStart;

    public AvailabilitySlot(AvailabilityParticipant participant, Instant slotStart) {
        this.participant = participant;
        this.slotStart = slotStart;
    }
}
