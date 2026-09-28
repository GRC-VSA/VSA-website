// src/officer_pages/availability/AvailabilityListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteSheet, listSheets } from "../../api/Availability.js";
import { dateBadge, describeDeadline, sortSheets } from "./availabilityFormat.js";
import "./Availability.css";

/*
    Every availability sheet, sorted on the frontend (see sortSheets): open sheets with the
    closest deadline first, closed sheets last.
*/
export default function AvailabilityListPage() {
    const navigate = useNavigate();
    const [sheets, setSheets] = useState(null);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let ignore = false;
        listSheets()
            .then((data) => !ignore && setSheets(sortSheets(data)))
            .catch((err) => !ignore && setError(err.message));
        return () => {
            ignore = true;
        };
    }, []);

    async function handleDelete(sheet) {
        if (!window.confirm(`Delete "${sheet.title}" and everyone's responses? This can't be undone.`)) return;
        setError("");
        try {
            await deleteSheet(sheet.sheetId);
            setSheets((prev) => prev.filter((s) => s.sheetId !== sheet.sheetId));
        } catch (err) {
            setError(err.message);
        }
    }

    const canDeleteAny = (sheets ?? []).some((s) => s.canManage);

    return (
        <div className="av-page">
            <div className="av-header">
                <h2 className="av-title">Availabilities</h2>
                <div className="av-actions">
                    {canDeleteAny && (
                        <button
                            type="button"
                            className="av-btn av-btn--outline"
                            aria-pressed={deleting}
                            onClick={() => setDeleting((d) => !d)}
                        >
                            {deleting ? "Done deleting" : "Delete availability"}
                        </button>
                    )}
                    <button type="button" className="av-btn av-btn--red" onClick={() => navigate("collect")}>
                        Collect new availability
                    </button>
                </div>
            </div>

            {error && <div className="av-error" role="alert">{error}</div>}

            {sheets === null && !error && <p className="av-hint">Loading…</p>}

            {sheets && sheets.length === 0 && (
                <div className="av-panel av-empty">
                    <p>No availability sheets yet. Start one to find a time that works for the board.</p>
                    <button type="button" className="av-btn av-btn--red" onClick={() => navigate("collect")}>
                        Collect new availability
                    </button>
                </div>
            )}

            {sheets && sheets.length > 0 && (
                <div className="av-list">
                    {sheets.map((sheet) => (
                        <SheetRow
                            key={sheet.sheetId}
                            sheet={sheet}
                            deleting={deleting}
                            onOpen={() => navigate(`${sheet.sheetId}`)}
                            onDelete={() => handleDelete(sheet)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SheetRow({ sheet, deleting, onOpen, onDelete }) {
    const badge = dateBadge(sheet);
    const deadline = describeDeadline(sheet.closesAt);

    return (
        <div
            className={`av-row${sheet.open ? "" : " is-closed"}`}
            role="link"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter") onOpen();
            }}
        >
            <div className="av-badge" aria-hidden="true">
                <span className="av-badge-month">{badge.month}</span>
                <span className="av-badge-days">{badge.days}</span>
            </div>

            <div className="av-row-text">
                <p className="av-row-title">{sheet.title}</p>
                {sheet.description && <p className="av-row-sub">{sheet.description}</p>}
                <div className="av-row-meta">
                    {!sheet.open ? (
                        <span>Closed</span>
                    ) : deadline ? (
                        <span>Closes {deadline}</span>
                    ) : null}
                    <span>
                        {sheet.responseCount} {sheet.responseCount === 1 ? "response" : "responses"}
                    </span>
                    {sheet.answeredByMe ? (
                        <span className="is-done">✓ You answered</span>
                    ) : (
                        sheet.open && <span className="is-todo">Not answered yet</span>
                    )}
                </div>
            </div>

            {sheet.location && (
                <div className="av-row-location">
                    <p className="av-row-location-label">Location</p>
                    <p className="av-row-location-value">{sheet.location}</p>
                </div>
            )}

            {deleting && sheet.canManage && (
                <button
                    type="button"
                    className="av-btn av-btn--red av-btn--small av-row-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    Delete
                </button>
            )}
        </div>
    );
}
