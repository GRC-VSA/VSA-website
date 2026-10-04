import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    closeSheet,
    deleteMyEntry,
    deleteSheet,
    getSheet,
    removeEntry,
    reopenSheet,
    saveMyEntry,
} from "../../api/Availability.js";
import AvailabilityGrid, { GroupHeatmap } from "./AvailabilityGrid.jsx";
import RespondersPanel from "./RespondersPanel.jsx";
import InviteLinksPanel from "./InviteLinksPanel.jsx";
import PageHeader from "./PageHeader.jsx";
import { bestWindows } from "./gridSelection.js";
import {
    browserTimeZone,
    describeDeadline,
    describeSheetTimes,
    describeWindow,
    timeZoneName,
} from "./availabilityFormat.js";
import "./Availability.css";

/*
    One sheet: the anonymous heatmap and responder list, and "Add my availability" to
    drag-select your own times. Saving replaces your whole selection (one entry per person per sheet).
*/
export default function AvailabilityDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [detail, setDetail] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState(location.state?.createError ?? "");
    const [mode, setMode] = useState("view");
    const [draft, setDraft] = useState(new Set());
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let ignore = false;
        getSheet(id)
            .then((data) => !ignore && setDetail(data))
            .catch((err) => !ignore && setLoadError(err.status === 404 ? "This sheet doesn't exist anymore." : err.message));
        return () => {
            ignore = true;
        };
    }, [id]);

    const mySaved = useMemo(() => new Set(detail?.myEntry?.slots ?? []), [detail]);

    const goBack = () => navigate("/officer/availability");

    if (loadError) {
        return (
            <main className="av-page">
                <PageHeader title="Availability" onBack={goBack} />
                <div className="av-error" role="alert">{loadError}</div>
            </main>
        );
    }
    if (!detail) {
        return (
            <main className="av-page">
                <PageHeader title="Availability" onBack={goBack} />
                <p className="av-loading">Loading…</p>
            </main>
        );
    }

    const { sheet, grid, heatmap, responders, myEntry, canManage } = detail;
    const viewerZone = browserTimeZone();
    const deadline = describeDeadline(sheet.closesAt);
    const best = bestWindows(grid, heatmap);
    const twoUp = grid.dates.length <= 7;

    function startEditing() {
        setDraft(new Set(myEntry?.slots ?? []));
        setNote(myEntry?.note ?? "");
        setActionError("");
        setMode("edit");
    }

    async function run(action) {
        setActionError("");
        try {
            await action();
        } catch (err) {
            setActionError(err.message);
        }
    }

    async function handleSave() {
        setSaving(true);
        await run(async () => {
            const updated = await saveMyEntry(sheet.sheetId, [...draft], note.trim() || null);
            setDetail(updated);
            setMode("view");
        });
        setSaving(false);
    }

    const handleWithdraw = () =>
        run(async () => {
            if (!window.confirm("Remove your response from this sheet?")) return;
            await deleteMyEntry(sheet.sheetId);
            setDetail(await getSheet(sheet.sheetId));
            setMode("view");
        });

    const handleClose = () => run(async () => setDetail(await closeSheet(sheet.sheetId)));
    const handleReopen = () => run(async () => setDetail(await reopenSheet(sheet.sheetId)));

    const handleDelete = () =>
        run(async () => {
            if (!window.confirm(`Delete "${sheet.title}" and everyone's responses? This can't be undone.`)) return;
            await deleteSheet(sheet.sheetId);
            goBack();
        });

    const handleRemovePerson = (person) =>
        run(async () => {
            if (!window.confirm(`Remove ${person.name}'s response?`)) return;
            await removeEntry(person.participantId);
            setDetail(await getSheet(sheet.sheetId));
        });

    return (
        <main className="av-page">
            <PageHeader title={sheet.title} subtitle={sheet.description} onBack={goBack} />

            {actionError && <div className="av-error" role="alert">{actionError}</div>}

            <section className="av-card">
                <div className="av-detail-head">
                    <div className="av-detail-pills" style={{ marginTop: 0 }}>
                        {!sheet.open && <span className="av-pill av-pill--red">Closed</span>}
                        {myEntry && <span className="av-pill av-pill--gold">✓ You answered</span>}
                    </div>
                    {mode === "view" && sheet.open && (
                        <button type="button" className="av-btn av-btn--primary" onClick={startEditing}>
                            {myEntry ? "Edit my availability" : "+ Add my availability"}
                        </button>
                    )}
                </div>
                <div className="av-facts">
                    <Fact label="When" value={describeSheetTimes(sheet)} />
                    {sheet.location && <Fact label="Location" value={sheet.location} />}
                    <Fact label={sheet.open ? "Closes" : "Status"} value={sheet.open ? deadline || "When the organizer closes it" : "Closed"} />
                </div>
                {viewerZone && viewerZone !== sheet.timezone && (
                    <p className="av-hint" style={{ marginTop: 12 }}>All times are in {timeZoneName(sheet.timezone)}.</p>
                )}
            </section>

            <section className="av-card">
                {mode === "edit" ? (
                    <>
                        <h2 className="av-card-title">{myEntry ? "Edit my availability" : "Add my availability"}</h2>
                        <div className={twoUp ? "av-edit-cols" : undefined}>
                            <div>
                                <p className="av-edit-col-title">Your times</p>
                                <p className="av-edit-col-sub">Click or drag across the times you're free. Drag over filled cells to clear them.</p>
                                <AvailabilityGrid grid={grid} sheetType={sheet.sheetType} mode="edit" heatmap={heatmap} selection={draft} onSelectionChange={setDraft} minColumn={twoUp ? 52 : 72} />
                            </div>
                            {twoUp && (
                                <div>
                                    <p className="av-edit-col-title">Everyone so far</p>
                                    <p className="av-edit-col-sub">Darker means more people are free.</p>
                                    <GroupHeatmap grid={grid} sheetType={sheet.sheetType} heatmap={heatmap} mySlots={new Set()} minColumn={52} showReadout={false} />
                                </div>
                            )}
                        </div>

                        <hr className="av-divider" />

                        <div className="av-field">
                            <label htmlFor="av-note" className="av-label">Anything the organizer should know? (optional)</label>
                            <textarea id="av-note" className="av-textarea" maxLength={1000} placeholder="e.g. I can only stay until 8 PM" value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>

                        <div className="av-form-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <span>
                                {myEntry && (
                                    <button type="button" className="av-link-btn" onClick={handleWithdraw}>
                                        Remove my response
                                    </button>
                                )}
                            </span>
                            <span style={{ display: "flex", gap: 10 }}>
                                <button type="button" className="av-btn av-btn--ghost" onClick={() => setMode("view")} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="button" className="av-btn av-btn--primary" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="av-card-title" style={{ marginBottom: 16 }}>Group availability</h2>
                        {best.length > 0 && (
                            <>
                                <p className="av-label" style={{ marginBottom: 8 }}>Best times</p>
                                <div className="av-best">
                                    {best.map((w) => (
                                        <div key={`${w.day}-${w.startRow}`} className="av-best-item">
                                            <div className="av-best-when">{describeWindow(grid, sheet, w)}</div>
                                            <div className="av-best-count">{w.count} of {heatmap.responderCount} free</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <GroupHeatmap grid={grid} sheetType={sheet.sheetType} heatmap={heatmap} mySlots={mySaved} />
                    </>
                )}
            </section>

            <RespondersPanel responders={responders} canManage={canManage} onRemove={handleRemovePerson} />

            <InviteLinksPanel sheetId={sheet.sheetId} canManage={canManage} />

            {canManage && (
                <section className="av-card">
                    <h2 className="av-card-title">Manage this sheet</h2>
                    <p className="av-card-sub">
                        {sheet.open
                            ? "Closing stops new answers. Everyone can still see the results."
                            : "Reopening lets people answer again."}
                    </p>
                    <div className="av-form-actions">
                        {sheet.open ? (
                            <button type="button" className="av-btn av-btn--secondary" onClick={handleClose}>
                                Close sheet
                            </button>
                        ) : (
                            <button type="button" className="av-btn av-btn--secondary" onClick={handleReopen}>
                                Reopen sheet
                            </button>
                        )}
                        <button type="button" className="av-btn av-btn--danger" onClick={handleDelete}>
                            Delete sheet
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}

function Fact({ label, value }) {
    return (
        <div>
            <p className="av-fact-label">{label}</p>
            <p className="av-fact-value">{value}</p>
        </div>
    );
}
