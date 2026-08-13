// src/officer_pages/availability/CollectAvailabilityFlow.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function buildCalendarDays() {
    return [
        [null, null, 21, 22, 23, 24, 25],
        [26, 27, 28, 29, 30, 31, 1],
        [2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 12, 13, 14, 15],
    ];
}

// small reusable hover button
function HoverButton({ style, hoverStyle, children, onClick }) {
    const [hover, setHover] = useState(false);
    return (
        <button
            style={{ ...style, ...(hover ? hoverStyle : {}) }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default function CollectAvailabilityFlow() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedDays, setSelectedDays] = useState(new Set(["29"]));
    const [hoveredDay, setHoveredDay] = useState(null);
    const [form, setForm] = useState({
        name: "",
        about: "",
        startTime: "9:30 AM",
        endTime: "11:30 AM",
        hasOutsideCollaborators: null,
    });

    const weeks = buildCalendarDays();

    return (
        <div style={s.card}>
            <div style={s.headerRow}>
                <h2 style={s.title}>Availabilities</h2>
                <HoverButton style={s.btnReturn} hoverStyle={s.btnReturnHover} onClick={() => navigate(-1)}>
                    Return &#8617;
                </HoverButton>
            </div>

            {step === 1 && (
                <div style={s.panel}>
                    <p style={s.panelTitle}>What days would you like to meet on?</p>
                    <p style={s.panelSubtitle}>Choose one or many days to meet</p>

                    <div style={s.calendarGrid}>
                        {DAY_LABELS.map((d) => (
                            <div key={d} style={s.dayLabelCell}>{d}</div>
                        ))}
                        {weeks.flat().map((day, i) => {
                            if (day === null) return <div key={i} />;
                            const isSelected = selectedDays.has(String(day));
                            const isHovered = hoveredDay === i;
                            const isMonthStart = i === 6;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...s.dayCell,
                                        background: isSelected ? "#1D9E75" : isHovered ? "#e8f5f0" : "transparent",
                                        color: isSelected ? "#fff" : "#333",
                                    }}
                                    onMouseEnter={() => setHoveredDay(i)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    onClick={() => {
                                        setSelectedDays((prev) => {
                                            const next = new Set(prev);
                                            const k = String(day);
                                            next.has(k) ? next.delete(k) : next.add(k);
                                            return next;
                                        });
                                    }}
                                >
                                    {isMonthStart && <div style={s.monthTag}>AUG</div>}
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <HoverButton style={s.btnGreen} hoverStyle={s.btnGreenHover} onClick={() => setStep(2)}>
                            Continue &#8594;
                        </HoverButton>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={s.panel}>
                    <div style={s.field}>
                        <label style={s.label}>Meeting name</label>
                        <input
                            style={s.input}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Badminton Tournament"
                        />
                    </div>

                    <div style={s.field}>
                        <label style={s.label}>What's the meeting about?</label>
                        <input
                            style={s.input}
                            value={form.about}
                            onChange={(e) => setForm({ ...form, about: e.target.value })}
                            placeholder="Fill out your availability for..."
                        />
                    </div>

                    <div style={s.field}>
                        <label style={s.label}>What time would you like to meet between?</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                style={{ ...s.input, width: "120px" }}
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                            />
                            <span style={{ fontSize: "13px", color: "#888" }}>to</span>
                            <input
                                style={{ ...s.input, width: "120px" }}
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={s.field}>
                        <label style={s.label}>Does this meeting have collaborators from outside VSA?</label>
                        <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
                            <label style={s.radioLabel}>
                                <input
                                    type="radio"
                                    checked={form.hasOutsideCollaborators === true}
                                    onChange={() => setForm({ ...form, hasOutsideCollaborators: true })}
                                />
                                YES
                            </label>
                            <label style={s.radioLabel}>
                                <input
                                    type="radio"
                                    checked={form.hasOutsideCollaborators === false}
                                    onChange={() => setForm({ ...form, hasOutsideCollaborators: false })}
                                />
                                NO
                            </label>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <HoverButton
                            style={s.btnGreen}
                            hoverStyle={s.btnGreenHover}
                            onClick={() => navigate("/dashboard/availability")}
                        >
                            Collect &#8594;
                        </HoverButton>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    card: { background: "#f7f7f8", borderRadius: "12px", padding: "24px 28px", minHeight: "480px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    title: { fontSize: "20px", fontWeight: 600, margin: 0, color: "#1a1a1a" },

    btnReturn: {
        background: "#c0392b", color: "#fff", border: "none", borderRadius: "8px",
        padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s",
    },
    btnReturnHover: { background: "#a5301f" },

    panel: { background: "#fff", borderRadius: "10px", padding: "24px", minHeight: "380px" },
    panelTitle: { fontSize: "15px", fontWeight: 600, margin: "0 0 4px", color: "#1a1a1a" },
    panelSubtitle: { fontSize: "12px", color: "#888", margin: "0 0 20px" },

    calendarGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "8px",
        width: "100%",
    },
    dayLabelCell: { fontSize: "12px", color: "#999", textAlign: "center", paddingBottom: "8px" },
    dayCell: {
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        borderRadius: "50%",
        fontSize: "14px",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.15s",
    },
    monthTag: { fontSize: "10px", fontWeight: 600, color: "#1D9E75", position: "absolute", top: "-16px", left: "50%", transform: "translateX(-50%)" },

    field: { marginBottom: "18px" },
    label: { fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" },
    input: {
        width: "100%", padding: "10px 12px", borderRadius: "6px",
        border: "1px solid #ddd", fontSize: "13px", outline: "none",
    },
    radioLabel: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" },

    btnGreen: {
        background: "#1D9E75", color: "#fff", border: "none", borderRadius: "8px",
        padding: "10px 20px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s",
    },
    btnGreenHover: { background: "#17835F" },
};