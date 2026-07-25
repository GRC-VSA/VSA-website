// src/pages/dashboard/AvailabilityPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 12:00am - 11:30pm in 30 min increments (full day)
const TIMES = [];
for (let h = 0; h < 24; h++) {
    TIMES.push(`${h}:00`);
    TIMES.push(`${h}:30`);
}

function formatTime(t) {
    const [h, m] = t.split(":");
    const hr = Number(h);
    const ap = hr >= 12 ? "pm" : "am";
    const h12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${h12}${m === "30" ? ":30" : ""}${ap}`;
}

function getWeekDates(offset) {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay() + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        return d;
    });
}

function formatWeekLabel(dates) {
    const opts = { month: "short", day: "numeric" };
    return `${dates[0].toLocaleDateString("en-US", opts)} - ${dates[6].toLocaleDateString("en-US", opts)}`;
}

function cellKey(weekOffset, dayIdx, time) {
    return `${weekOffset}_${dayIdx}_${time}`;
}

export default function AvailabilityPage() {
    const [selected, setSelected] = useState(new Set());
    const [weekOffset, setWeekOffset] = useState(0);
    const [status, setStatus] = useState("unsaved"); // "unsaved" | "saved" | "clean"
    const isDragging = useRef(false);
    const dragMode = useRef(null);

    const weekDates = getWeekDates(weekOffset);
    const today = new Date().toDateString();

    useEffect(() => {
        const stopDrag = () => {
            isDragging.current = false;
            dragMode.current = null;
        };
        document.addEventListener("mouseup", stopDrag);
        return () => document.removeEventListener("mouseup", stopDrag);
    }, []);

    const toggleCell = useCallback((key) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (dragMode.current === "select") {
                next.add(key);
            } else {
                next.delete(key);
            }
            return next;
        });
        setStatus("unsaved");
    }, []);

    function handleMouseDown(e, key) {
        e.preventDefault();
        isDragging.current = true;
        dragMode.current = selected.has(key) ? "deselect" : "select";
        toggleCell(key);
    }

    function handleMouseEnter(key) {
        if (isDragging.current) toggleCell(key);
    }

    function applyPreset(kind) {
        const weekdayIdx = [1, 2, 3, 4, 5];
        const weekendIdx = [0, 6];
        const morning = TIMES.filter((t) => Number(t.split(":")[0]) < 12);
        const evening = TIMES.filter((t) => Number(t.split(":")[0]) >= 16);

        let days, times;
        if (kind === "weekday-morning") {
            days = weekdayIdx;
            times = morning;
        } else if (kind === "weekday-evening") {
            days = weekdayIdx;
            times = evening;
        } else {
            days = weekendIdx;
            times = TIMES;
        }

        setSelected((prev) => {
            const next = new Set(prev);
            days.forEach((d) => times.forEach((t) => next.add(cellKey(weekOffset, d, t))));
            return next;
        });
        setStatus("unsaved");
    }

    function clearAll() {
        setSelected(new Set());
        setStatus("unsaved");
    }

    function saveAvailability() {
        // TODO: POST to /api/availability when backend is ready
        // const payload = [...selected].map(key => {
        //   const [offset, dayIdx, time] = key.split("_");
        //   return {
        //     date: getWeekDates(Number(offset))[Number(dayIdx)].toISOString().split("T")[0],
        //     time,
        //   };
        // });
        setStatus("saved");
    }

    return (
        <div style={s.container}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={s.headerRow}>
                <div>
                    <p style={s.title}>Officer meeting availability</p>
                    <p style={s.subtitle}>Select the times you are available for meetings.</p>
                </div>
                <span style={{
                    ...s.statusText,
                    color: status === "saved" ? "#1D9E75" : status === "unsaved" ? "#BA7517" : "#999",
                }}>
          {status === "saved" ? "Saved" : status === "unsaved" ? "Unsaved changes" : "Not saved"}
        </span>
            </div>

            {/* ── Presets ────────────────────────────────────────── */}
            <div style={s.presetRow}>
                <button style={s.presetBtn} onClick={() => applyPreset("weekday-morning")}>
                    Weekday mornings
                </button>
                <button style={s.presetBtn} onClick={() => applyPreset("weekday-evening")}>
                    Weekday evenings
                </button>
                <button style={s.presetBtn} onClick={() => applyPreset("weekend")}>
                    Weekends
                </button>
                <button style={{ ...s.presetBtn, color: "#888" }} onClick={clearAll}>
                    Clear
                </button>
            </div>

            {/* ── Week navigation ────────────────────────────────── */}
            <div style={s.weekNav}>
                <button style={s.navBtn} onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
                    &#8249;
                </button>
                <div style={s.monthYearContainer}>
                    <span style={s.monthYear}>
                        {weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <span style={s.weekLabel}>{formatWeekLabel(weekDates)}</span>
                </div>
                <button style={s.navBtn} onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
                    &#8250;
                </button>
            </div>

            {/* ── Grid ───────────────────────────────────────────── */}
            <div style={s.gridWrap}>
                <div style={s.grid}>
                    <div />
                    {weekDates.map((date, di) => {
                        const isToday = date.toDateString() === today;
                        return (
                            <div key={di} style={s.dayHead}>
                                <div style={{ fontSize: "11px", fontWeight: 500, color: isToday ? "#1D9E75" : "#666" }}>
                                    {DAYS[di]}
                                </div>
                                <div style={{ fontSize: "12px", color: isToday ? "#1D9E75" : "#999" }}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}

                    {TIMES.map((time, ti) => (
                        <>
                            <div key={`label-${ti}`} style={s.timeLabel}>
                                {time.endsWith(":00") ? formatTime(time) : ""}
                            </div>
                            {weekDates.map((_, di) => {
                                const key = cellKey(weekOffset, di, time);
                                const isSelected = selected.has(key);
                                return (
                                    <div
                                        key={key}
                                        style={{
                                            ...s.cell,
                                            background: isSelected ? "#1D9E75" : "#f9f9f9",
                                            borderColor: isSelected ? "#0F6E56" : "#e0e0e0",
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, key)}
                                        onMouseEnter={() => handleMouseEnter(key)}
                                    />
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* ── Footer actions ─────────────────────────────────── */}
            <div style={s.footer}>
                <button style={s.saveBtn} onClick={saveAvailability}>
                    Save availability
                </button>
                <span style={s.summary}>
          {selected.size} slot{selected.size !== 1 ? "s" : ""} selected
        </span>
                <span style={s.responseTracker}>
          3 of 5 officers responded
        </span>
            </div>
        </div>
    );
}

const s = {
    container: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "0.5px solid #e0e0e0",
        padding: "24px",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "4px",
        gap: "12px",
        flexWrap: "wrap",
    },
    title: { fontWeight: 500, fontSize: "15px", margin: 0 },
    subtitle: { fontSize: "13px", color: "#888", margin: "2px 0 0" },
    statusText: { fontSize: "12px", whiteSpace: "nowrap" },
    presetRow: { display: "flex", gap: "8px", flexWrap: "wrap", margin: "14px 0" },
    presetBtn: {
        fontSize: "13px",
        padding: "6px 12px",
        background: "transparent",
        border: "0.5px solid #ccc",
        borderRadius: "6px",
        cursor: "pointer",
    },
    weekNav: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
    navBtn: {
        width: "28px",
        height: "28px",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "0.5px solid #ccc",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
        color: "#666",
    },
    monthYearContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
    monthYear: { fontSize: "12px", fontWeight: 600, color: "#1a1a1a" },
    weekLabel: { fontSize: "13px", fontWeight: 500, color: "#666" },
    gridWrap: { overflowX: "auto" },
    grid: {
        display: "grid",
        gridTemplateColumns: "56px repeat(7, 1fr)",
        gap: "2px",
        minWidth: "480px",
    },
    dayHead: { textAlign: "center", padding: "4px 2px" },
    timeLabel: {
        fontSize: "10px",
        color: "#aaa",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: "8px",
        height: "22px",
        whiteSpace: "nowrap",
    },
    cell: {
        height: "22px",
        borderRadius: "3px",
        border: "0.5px solid #e0e0e0",
        cursor: "pointer",
        userSelect: "none",
    },
    footer: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginTop: "16px",
        flexWrap: "wrap",
    },
    saveBtn: {
        background: "#1D9E75",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "8px 18px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
    },
    summary: { fontSize: "13px", color: "#888" },
    responseTracker: {
        marginLeft: "auto",
        fontSize: "12px",
        color: "#999",
    },
};