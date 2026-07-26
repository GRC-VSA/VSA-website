// src/officer_pages/availability/AvailabilityListPage.jsx
import { useNavigate } from "react-router-dom";

const MOCK_AVAILABILITIES = [
    {
        id: 1,
        month: "SEPT",
        days: "16, 17, 18",
        title: "Discussing format for Badminton Tournament",
        subtitle: "Event team discussing the tournament format",
        location: "SH 152",
    },
    {
        id: 2,
        month: "AUG",
        days: "6, 7",
        title: "Shooting for Miss Boba Music Video",
        subtitle: "I need the whole club availability to meet and shoot MV for Miss Boba",
        location: "485 Rainier Ave S, Suite B Renton, WA 98057",
    },
    {
        id: 3,
        month: "OCT",
        days: "12",
        title: "Badminton Tournament",
        subtitle: "Fill out your availability for the official date of the Badminton Tournament",
        location: "RAC - Green River College",
    },
];

export default function AvailabilityListPage() {
    const navigate = useNavigate();

    return (
        <div style={s.card}>
            <div style={s.headerRow}>
                <h2 style={s.title}>Availabilities</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button style={s.btnOutline}>Delete availability</button>
                    <button style={s.btnPrimary} onClick={() => navigate("collect")}>
                        Collect new availability
                    </button>
                </div>
            </div>

            <div style={s.list}>
                {MOCK_AVAILABILITIES.map((item) => (
                    <div
                        key={item.id}
                        style={s.row}
                        onClick={() => navigate(`${item.id}`)}
                    >
                        <div style={s.dateBadge}>
                            <span style={s.dateMonth}>{item.month}</span>
                            <span style={s.dateDays}>{item.days}</span>
                        </div>
                        <div style={s.rowText}>
                            <p style={s.rowTitle}>{item.title}</p>
                            <p style={s.rowSubtitle}>{item.subtitle}</p>
                        </div>
                        <div style={s.locationBlock}>
                            <p style={s.locationLabel}>Location</p>
                            <p style={s.locationValue}>{item.location}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const s = {
    card: {
        background: "#f7f7f8",
        borderRadius: "12px",
        padding: "24px 28px",
        minHeight: "480px",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
    },
    title: { fontSize: "20px", fontWeight: 600, margin: 0, color: "#1a1a1a" },
    btnOutline: {
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
    },
    btnPrimary: {
        background: "#c0392b",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
    },
    list: { display: "flex", flexDirection: "column", gap: "14px" },
    row: {
        background: "#fff",
        borderRadius: "10px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    dateBadge: {
        background: "#1a1a1a",
        color: "#fff",
        borderRadius: "8px",
        padding: "8px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "64px",
    },
    dateMonth: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px" },
    dateDays: { fontSize: "13px", fontWeight: 600 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: "14px", fontWeight: 600, margin: "0 0 4px", color: "#1a1a1a" },
    rowSubtitle: { fontSize: "12px", color: "#888", margin: 0 },
    locationBlock: { textAlign: "right", minWidth: "160px" },
    locationLabel: { fontSize: "11px", color: "#aaa", margin: "0 0 2px" },
    locationValue: { fontSize: "12px", color: "#555", margin: 0, lineHeight: 1.4 },
};