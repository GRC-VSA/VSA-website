// src/pages/dashboard/AvailabilityPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = [
    "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM", "7:00 PM",
];

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
    return `${dates[0].toLocaleDateString("en-US", opts)} – ${dates[6].toLocaleDateString("en-US", opts)}`;
}

function cellKey(weekOffset, dayIdx, timeIdx) {
    return `${weekOffset}_${dayIdx}_${timeIdx}`;
}

export default function AvailabilityPage() {
    const [selected, setSelected] = useState(new Set());
    const [weekOffset, setWeekOffset] = useState(0);
    const [toast, setToast] = useState(false);
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

    function clearAll() {
        setSelected(new Set());
    }

    function saveAvailability() {
        // TODO: POST to /api/availability when backend is ready
        // const payload = [...selected].map(key => {
        //   const [offset, dayIdx, timeIdx] = key.split("_").map(Number);
        //   return {
        //     date: getWeekDates(offset)[dayIdx].toISOString().split("T")[0],
        //     time: TIMES[timeIdx],
        //   };
        // });
        setToast(true);
        setTimeout(() => setToast(false), 2500);
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>Set your availability</h2>
                    <p style={s.subtitle}>
                        Click or drag cells to mark when you're free for officer meetings
                    </p>
                </div>
                <div style={s.legend}>
                    <div style={s.legendItem}>
                        <div style={{ ...s.legendDot, background: "#1D9E75" }} />
                        <span>Available</span>
                    </div>
                    <div style={s.legendItem}>
                        <div style={{ ...s.legendDot, border: "1px solid #ccc" }} />
                        <span>Unavailable</span>
                    </div>
                </div>
            </div>

            <div style={s.weekNav}>
                <button style={s.navBtn} onClick={() => setWeekOffset((w) => w - 1)}>
                    &#8249;
                </button>
                <span style={s.weekLabel}>{formatWeekLabel(weekDates)}</span>
                <button style={s.navBtn} onClick={() => setWeekOffset((w) => w + 1)}>
                    &#8250;
                </button>
            </div>

            <div style={s.gridWrap}>
                <div style={s.grid}>
                    <div />
                    {weekDates.map((date, di) => {
                        const isToday = date.toDateString() === today;
                        return (
                            <div key={di} style={s.dayHead}>
                                <div style={{
                                    fontWeight: isToday ? 500 : 400,
                                    color: isToday ? "#1D9E75" : "#666",
                                    fontSize: "12px",
                                }}>
                                    {DAYS[di]}
                                </div>
                                <div style={{
                                    fontSize: "13px",
                                    color: isToday ? "#1D9E75" : "#999",
                                }}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}

                    {TIMES.map((time, ti) => (
                        <>
                            <div key={`label-${ti}`} style={s.timeLabel}>{time}</div>
                            {weekDates.map((_, di) => {
                                const key = cellKey(weekOffset, di, ti);
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

            <div style={s.actions}>
                <button style={s.btnSave} onClick={saveAvailability}>
                    Save availability
                </button>
                <button style={s.btnClear} onClick={clearAll}>
                    Clear all
                </button>
                <span style={s.summary}>
          {selected.size} slot{selected.size !== 1 ? "s" : ""} selected
        </span>
            </div>

            {toast && <div style={s.toast}>Availability saved</div>}
        </div>
    );
}

const s = {
    container: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "0.5px solid #e0e0e0",
        padding: "32px",
        position: "relative",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px",
    },
    title: { fontSize: "18px", fontWeight: 500, margin: "0 0 4px", color: "#1a1a1a" },
    subtitle: { fontSize: "14px", color: "#888", margin: 0 },
    legend: { display: "flex", gap: "16px", alignItems: "center" },
    legendItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888" },
    legendDot: { width: "14px", height: "14px", borderRadius: "3px" },
    weekNav: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
    navBtn: {
        background: "transparent", border: "0.5px solid #ccc", borderRadius: "6px",
        width: "30px", height: "30px", cursor: "pointer", fontSize: "18px",
        color: "#666", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
    },
    weekLabel: { fontSize: "14px", fontWeight: 500, color: "#1a1a1a", minWidth: "180px", textAlign: "center" },
    gridWrap: { overflowX: "auto" },
    grid: { display: "grid", gridTemplateColumns: "68px repeat(7, 1fr)", gap: "3px", minWidth: "520px" },
    dayHead: { textAlign: "center", padding: "6px 4px" },
    timeLabel: {
        fontSize: "11px", color: "#aaa", display: "flex", alignItems: "center",
        justifyContent: "flex-end", paddingRight: "10px", height: "32px", whiteSpace: "nowrap",
    },
    cell: {
        height: "32px", borderRadius: "4px", border: "0.5px solid #e0e0e0",
        cursor: "pointer", transition: "background 0.1s", userSelect: "none",
    },
    actions: { display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" },
    btnSave: {
        background: "#1D9E75", color: "#fff", border: "none", borderRadius: "6px",
        padding: "9px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer",
    },
    btnClear: {
        background: "transparent", color: "#666", border: "0.5px solid #ccc",
        borderRadius: "6px", padding: "9px 20px", fontSize: "14px", cursor: "pointer",
    },
    summary: { fontSize: "13px", color: "#888", marginLeft: "auto" },
    toast: {
        position: "absolute", top: "16px", right: "16px", background: "#1D9E75",
        color: "#fff", padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
    },
};