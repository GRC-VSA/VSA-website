package com.vsa.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a shareable link that lets people without a VSA officer account fill in an
 * availability sheet.
 *
 * <p>The raw token is stored so officers can copy the link again later. A leaked link is handled by
 * revoking it, not by hiding it.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "availability_invites")
public class AvailabilityInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invite_id")
    private Long inviteId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sheet_id", nullable = false)
    private AvailabilitySheet sheet;

    /** Unique in the database (see the SQL file); not marked unique here so ddl-auto: update
     * doesn't add a second, differently named unique constraint. */
    @Column(nullable = false, length = 64)
    private String token;

    /** Shown next to guest names and copied into their participant role label. */
    @Column(length = 100)
    private String label;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    /** Maximum number of guest entries this link may create; null = unlimited. */
    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "use_count", nullable = false)
    private int useCount = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    /** Not revoked and not expired. */
    public boolean isActiveAt(Instant now) {
        return revokedAt == null && (expiresAt == null || now.isBefore(expiresAt));
    }

    public boolean hasUsesLeft() {
        return maxUses == null || useCount < maxUses;
    }
}
