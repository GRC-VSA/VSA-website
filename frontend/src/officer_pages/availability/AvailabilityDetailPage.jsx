// src/officer_pages/availability/AvailabilityDetailPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOURS = ["11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
const RESPONDERS = ["Tuan", "Marvin", "Dung", "Kim", "Jayden", "My", "Jenny", "Jennifer"];
const MOCK_INTENSITY = [1, 1, 0.6, 0.6, 0.35, 0, 0];

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

export default function AvailabilityDetailPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("view");
    const [mySlots, setMySlots] = useState(new Set());
    const [hoveredRow, setHoveredRow] = useState(null);

    function greenShade(intensity) {
        if (intensity === 0) return "#f2f2f2";
        if (intensity >= 1) return "#1D9E75";
        if (intensity >= 0.6) return "#5DCAA5";
        return "#9FE1CB";
    }

    return (
        <div style={s.card}>
            <div style={s.headerRow}>
                <h2 style={s.title}>Availabilities</h2>
                <HoverButton style={s.btnReturn} hoverStyle={s.btnReturnHover} onClick={() => navigate(-1)}>
                    Return &#8617;
                </HoverButton>
            </div>

            <div style={s.meetingBlock}>
                <p style={s.meetingTitle}>Badminton Tournament</p>
                <p style={s.meetingSubtitle}>
                    Fill out your availability for the official date of the Badminton Tournament
                </p>

                <div style={s.dateRow}>
                    <span style={s.dateLabel}>Monday, October 12 from 11 AM - 5:30 PM</span>
                    {mode === "view" ? (
                        <HoverButton style={s.btnAdd} hoverStyle={s.btnAddHover} onClick={() => setMode("edit")}>
                            Add availability +
                        </HoverButton>
                    ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <HoverButton style={s.btnCancel} hoverStyle={s.btnCancelHover} onClick={() => setMode("view")}>
                                Cancel &#10005;
                            </HoverButton>
                            <HoverButton style={s.btnSave} hoverStyle={s.btnSaveHover} onClick={() => setMode("view")}>
                                Save &#10003;
                            </HoverButton>
                        </div>
                    )}
                </div>

                <div style={s.gridSection}>
                    <div style={s.gridArea}>
                        <div style={s.dayLabel}>Mon<br /><span style={{ color: "#999" }}>12</span></div>
                        {HOURS.map((h, i) => {
                            const isHovered = hoveredRow === i;
                            return (
                                <div key={h} style={s.hourRow}>
                                    <span style={s.hourLabel}>{h}</span>
                                    <div
                                        style={{
                                            ...s.hourBar,
                                            background: mode === "view" ? greenShade(MOCK_INTENSITY[i]) : "#fff",
                                            cursor: mode === "edit" ? "pointer" : "default",
                                            border: mode === "edit" ? "1px solid #ddd" : "none",
                                            filter: mode === "edit" && isHovered ? "brightness(0.97)" : "none",
                                        }}
                                        onMouseEnter={() => mode === "edit" && setHoveredRow(i)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        onClick={() => {
                                            if (mode !== "edit") return;
                                            setMySlots((prev) => {
                                                const next = new Set(prev);
                                                next.has(h) ? next.delete(h) : next.add(h);
                                                return next;
                                            });
                                        }}
                                    >
                                        {mode === "edit" && mySlots.has(h) && (
                                            <div style={s.editedFill} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={s.respondersBlock}>
                        <p style={s.respondersLabel}>
                            Responders ({mode === "view" ? "5/6" : "6"})
                        </p>
                        <div style={s.respondersGrid}>
                            {RESPONDERS.map((name) => (
                                <span key={name} style={s.responderName}>{name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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

    meetingBlock: { background: "#fff", borderRadius: "10px", padding: "20px 24px" },
    meetingTitle: { fontSize: "15px", fontWeight: 600, margin: "0 0 4px", color: "#1a1a1a" },
    meetingSubtitle: { fontSize: "12px", color: "#888", margin: "0 0 20px" },
    dateRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    dateLabel: { fontSize: "13px", fontWeight: 500, color: "#333" },

    btnAdd: {
        background: "#1D9E75", color: "#fff", border: "none", borderRadius: "6px",
        padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s",
    },
    btnAddHover: { background: "#17835F" },

    btnCancel: {
        background: "#fff", border: "1px solid #ddd", borderRadius: "6px",
        padding: "6px 14px", fontSize: "12px", cursor: "pointer",
        transition: "background 0.15s",
    },
    btnCancelHover: { background: "#f2f2f2" },

    btnSave: {
        background: "#1D9E75", color: "#fff", border: "none", borderRadius: "6px",
        padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s",
    },
    btnSaveHover: { background: "#17835F" },

    gridSection: { display: "flex", gap: "32px" },
    gridArea: { flex: 1 },
    dayLabel: { fontSize: "11px", textAlign: "center", color: "#333", marginBottom: "6px", marginLeft: "56px" },
    hourRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" },
    hourLabel: { fontSize: "11px", color: "#999", width: "40px", textAlign: "right", flexShrink: 0 },
    hourBar: { flex: 1, height: "32px", borderRadius: "3px", position: "relative", width: "100%", transition: "filter 0.1s" },
    editedFill: { position: "absolute", inset: 0, background: "#1D9E75", borderRadius: "3px" },
    respondersBlock: { minWidth: "150px", flexShrink: 0 },
    respondersLabel: { fontSize: "12px", fontWeight: 600, color: "#333", marginBottom: "10px" },
    respondersGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" },
    responderName: { fontSize: "12px", color: "#555" },
};