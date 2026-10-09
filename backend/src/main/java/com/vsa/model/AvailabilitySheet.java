package com.vsa.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing one availability sheet: a grid of days x time slots that officers (and
 * invited outsiders) mark themselves free on.
 *
 * <p>The table is created by the hand-written availability_schema.sql, which also holds the CHECK
 * constraints and partial unique indexes Hibernate cannot generate.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "availability_sheets")
public class AvailabilitySheet {

    /** MEETING = standalone meeting, EVENT = tied to an events row, GENERAL = one sample week. */
    public enum SheetType {
        MEETING,
        EVENT,
        GENERAL
    }

    /** CLOSED means closed by hand. A sheet is also closed once {@link #closesAt} has passed. */
    public enum Status {
        OPEN,
        CLOSED
    }

    // ── Primary Key ────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sheet_id")
    private Long sheetId;

    // ── Basic Information ──────────────────────────────────────
    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "sheet_type", nullable = false, length = 20)
    private SheetType sheetType;

    /** Only set for EVENT sheets. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    /** Only set for GENERAL sheets. */
    @Column(name = "quarter_start")
    private LocalDate quarterStart;

    @Column(name = "quarter_end")
    private LocalDate quarterEnd;

    // ── Grid Definition ────────────────────────────────────────
    @Column(name = "date_start", nullable = false)
    private LocalDate dateStart;

    @Column(name = "date_end", nullable = false)
    private LocalDate dateEnd;

    @Column(name = "day_start_time", nullable = false)
    private LocalTime dayStartTime;

    @Column(name = "day_end_time", nullable = false)
    private LocalTime dayEndTime;

    @Column(name = "slot_minutes", nullable = false)
    private int slotMinutes = 30;

    /** IANA zone the grid is drawn in. Slot instants are stored in UTC. */
    @Column(nullable = false, length = 50)
    private String timezone = "America/Los_Angeles";

    // ── Status ─────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "closes_at")
    private Instant closesAt;

    // ── Metadata ───────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Helpers ────────────────────────────────────────────────

    /** Open = not closed by hand and the deadline (if any) has not passed. */
    public boolean isOpenAt(Instant now) {
        return status == Status.OPEN && (closesAt == null || now.isBefore(closesAt));
    }

    public ZoneId zoneId() {
        return ZoneId.of(timezone);
    }
}
