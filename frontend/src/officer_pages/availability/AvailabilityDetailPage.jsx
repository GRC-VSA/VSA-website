import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteSheet, listSheets } from "../../api/Availability.js";
import { dateBadge, describeDeadline, groupSheets } from "./availabilityFormat.js";
import PageHeader from "./PageHeader.jsx";
import "./Availability.css";

/*
    Every availability sheet, grouped into Events and General meetings, with closed sheets folded
    away at the bottom. Within a group, the closest deadline comes first.
*/
export default function AvailabilityListPage() {
    const navigate = useNavigate();
    const [sheets, setSheets] = useState(null);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showClosed, setShowClosed] = useState(false);

    useEffect(() => {
        let ignore = false;
        listSheets()
            .then((data) => !ignore && setSheets(data))
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

    const groups = sheets ? groupSheets(sheets) : null;
    const canDeleteAny = (sheets ?? []).some((s) => s.canManage);
    const startNew = () => navigate("collect");

    const renderCards = (list) => (
        <div className="av-list">
            {list.map((sheet) => (
                <SheetCard
                    key={sheet.sheetId}
                    sheet={sheet}
                    deleting={deleting}
                    onOpen={() => navigate(`${sheet.sheetId}`)}
                    onDelete={() => handleDelete(sheet)}
                />
            ))}
        </div>
    );

    return (
        <main className="av-page">
            <PageHeader title="Availability" subtitle="Find times that work for the board and the people we work with" />

            <div className="av-toolbar">
                {canDeleteAny && (
                    <button
                        type="button"
                        className="av-btn av-btn--ghost"
                        aria-pressed={deleting}
                        onClick={() => setDeleting((d) => !d)}
                    >
                        {deleting ? "Done" : "Delete sheets"}
                    </button>
                )}
                <button type="button" className="av-btn av-btn--primary" onClick={startNew}>
                    + Collect availability
                </button>
            </div>

            {error && <div className="av-error" role="alert">{error}</div>}
            {sheets === null && !error && <p className="av-loading">Loading…</p>}

            {sheets && sheets.length === 0 && (
                <div className="av-card av-empty">
                    <h2>No availability sheets yet</h2>
                    <p>Start one to find a time that works for everyone.</p>
                    <button type="button" className="av-btn av-btn--primary" onClick={startNew}>
                        + Collect availability
                    </button>
                </div>
            )}

            {groups && groups.events.length > 0 && (
                <section className="av-group" aria-labelledby="av-group-events">
                    <h2 className="av-group-title" id="av-group-events">
                        Events <span>{groups.events.length} open</span>
                    </h2>
                    {renderCards(groups.events)}
                </section>
            )}

            {groups && groups.meetings.length > 0 && (
                <section className="av-group" aria-labelledby="av-group-meetings">
                    <h2 className="av-group-title" id="av-group-meetings">
                        General meetings <span>{groups.meetings.length} open</span>
                    </h2>
                    {renderCards(groups.meetings)}
                </section>
            )}

            {groups && groups.closed.length > 0 && (
                <section className="av-group">
                    <button
                        type="button"
                        className="av-closed-toggle"
                        aria-expanded={showClosed}
                        onClick={() => setShowClosed((s) => !s)}
                    >
                        {showClosed ? "▾" : "▸"} Closed <span>{groups.closed.length}</span>
                    </button>
                    {showClosed && renderCards(groups.closed)}
                </section>
            )}
        </main>
    );
}

function SheetCard({ sheet, deleting, onOpen, onDelete }) {
    const badge = dateBadge(sheet);
    const deadline = describeDeadline(sheet.closesAt);

    return (
        <div
            className={`av-sheet-card${sheet.open ? "" : " is-closed"}`}
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

            <div className="av-sheet-main">
                <p className="av-sheet-title">{sheet.title}</p>
                {sheet.description && <p className="av-sheet-desc">{sheet.description}</p>}
                <div className="av-sheet-meta">
                    {!sheet.open ? (
                        <span className="av-pill">Closed</span>
                    ) : sheet.answeredByMe ? (
                        <span className="av-pill av-pill--gold">✓ You answered</span>
                    ) : (
                        <span className="av-pill av-pill--red">Needs your answer</span>
                    )}
                    <span className="av-pill">
                        {sheet.responseCount} {sheet.responseCount === 1 ? "response" : "responses"}
                    </span>
                    {sheet.open && deadline && <span className="av-pill">Closes {deadline}</span>}
                </div>
            </div>

            {sheet.location && !deleting && (
                <div className="av-sheet-side">
                    <p className="av-sheet-side-label">Location</p>
                    <p className="av-sheet-side-value">{sheet.location}</p>
                </div>
            )}

            {deleting && sheet.canManage && (
                <button
                    type="button"
                    className="av-btn av-btn--danger av-btn--small"
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