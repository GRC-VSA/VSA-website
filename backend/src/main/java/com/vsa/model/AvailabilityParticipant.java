package com.vsa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing one person's entry on one availability sheet.
 *
 * <p>An officer entry has {@link #user} set. An outsider entry has guest name/email and a hashed
 * edit token instead. The database enforces one entry per person per sheet.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "availability_participants")
public class AvailabilityParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "participant_id")
    private Long participantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sheet_id", nullable = false)
    private AvailabilitySheet sheet;

    /** Null for outsiders. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid")
    private User user;

    @Column(name = "guest_name", length = 100)
    private String guestName;

    /** Stored lowercase. */
    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    /** SHA-256 hex of the guest's edit token. The raw token only ever lives in their link. */
    @Column(name = "edit_token_hash", length = 64)
    private String editTokenHash;

    @Column(name = "role_label", length = 100)
    private String roleLabel;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invite_id")
    private AvailabilityInvite invite;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AvailabilitySlot> slots = new ArrayList<>();

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = this.submittedAt;
    }

    public boolean isGuest() {
        return user == null;
    }

    /** Full name for officers, typed name for guests. */
    public String displayName() {
        if (user != null) {
            return (user.getFirstName() + " " + user.getLastName()).trim();
        }
        return guestName;
    }
}
