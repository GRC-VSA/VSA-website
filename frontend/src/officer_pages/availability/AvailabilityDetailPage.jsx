// src/officer_pages/availability/AvailabilityDetailPage.jsx
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
import AvailabilityGrid, { HeatmapLegend } from "./AvailabilityGrid.jsx";
import RespondersPanel from "./RespondersPanel.jsx";
import InviteLinksPanel from "./InviteLinksPanel.jsx";
import { browserTimeZone, describeDeadline, describeSheetTimes, timeZoneName } from "./availabilityFormat.js";
import "./Availability.css";

/*
    One sheet: the anonymous heatmap and responder list, and "Add availability" to drag-select
    your own times. Saving replaces your whole selection (one entry per person per sheet).
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
            <div className="av-page">
                <Header onReturn={goBack} />
                <div className="av-error">{loadError}</div>
            </div>
        );
    }
    if (!detail) {
        return (
            <div className="av-page">
                <Header onReturn={goBack} />
                <p className="av-hint">Loading…</p>
            </div>
        );
    }

    const { sheet, grid, heatmap, responders, myEntry, canManage } = detail;
    const viewerZone = browserTimeZone();
    const deadline = describeDeadline(sheet.closesAt);

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
        <div className="av-page">
            <Header onReturn={goBack} />

            {actionError && <div className="av-error" role="alert">{actionError}</div>}

            <div className="av-panel">
                <div className="av-sheet-head">
                    <p className="av-sheet-title">
                        {sheet.title}
                        {!sheet.open && <span className="av-chip av-chip--closed">Closed</span>}
                    </p>
                    {sheet.description && <p className="av-sheet-desc">{sheet.description}</p>}
                    {(sheet.location || deadline) && (
                        <p className="av-hint" style={{ marginTop: 6 }}>
                            {sheet.location && <>Location: {sheet.location}</>}
                            {sheet.location && deadline && <>&nbsp;&nbsp;|&nbsp;&nbsp;</>}
                            {deadline && <>{sheet.open ? "Closes" : "Closed"} {deadline}</>}
                        </p>
                    )}
                </div>

                <div className="av-toolbar">
                    <div>
                        <p className="av-when">{describeSheetTimes(sheet)}</p>
                        {viewerZone && viewerZone !== sheet.timezone && (
                            <p className="av-when-sub">Times are in {timeZoneName(sheet.timezone)}</p>
                        )}
                    </div>

                    {mode === "view" ? (
                        sheet.open && (
                            <button type="button" className="av-btn av-btn--green" onClick={startEditing}>
                                {myEntry ? "Edit my availability" : "Add availability"} ⊕
                            </button>
                        )
                    ) : (
                        <div className="av-actions">
                            <button type="button" className="av-btn av-btn--quiet" onClick={() => setMode("view")} disabled={saving}>
                                Cancel ⊗
                            </button>
                            <button type="button" className="av-btn av-btn--green" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving…" : "Save ✓"}
                            </button>
                        </div>
                    )}
                </div>

                {mode === "edit" && (
                    <p className="av-hint" style={{ marginBottom: 10 }}>
                        Click or drag across the times you're free. Drag over green cells to clear them.
                    </p>
                )}

                {mode === "view" && !heatmap.visible && (
                    <p className="av-hidden-heatmap">
                        The group heatmap shows up once {heatmap.minResponders} people have responded
                        ({heatmap.responderCount} so far). This keeps early answers anonymous.
                    </p>
                )}

                <div className="av-body">
                    <div className="av-grid-scroll">
                        <AvailabilityGrid
                            grid={grid}
                            sheetType={sheet.sheetType}
                            mode={mode}
                            heatmap={heatmap}
                            selection={mode === "edit" ? draft : mySaved}
                            onSelectionChange={setDraft}
                        />
                        {mode === "view" && <HeatmapLegend heatmap={heatmap} showMine={mySaved.size > 0} />}

                        {mode === "edit" && (
                            <div className="av-field" style={{ marginTop: 18, marginBottom: 0 }}>
                                <label htmlFor="av-note">Anything the organizer should know? (optional)</label>
                                <textarea
                                    id="av-note"
                                    className="av-textarea"
                                    maxLength={1000}
                                    placeholder="e.g. I can only stay until 8 PM"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                {myEntry && (
                                    <p style={{ marginTop: 10 }}>
                                        <button type="button" className="av-link-btn" onClick={handleWithdraw}>
                                            Remove my response
                                        </button>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <RespondersPanel responders={responders} canManage={canManage} onRemove={handleRemovePerson} />
                </div>
            </div>

            <div className="av-panel">
                <InviteLinksPanel sheetId={sheet.sheetId} canManage={canManage} />
            </div>

            {canManage && (
                <div className="av-panel">
                    <p className="av-panel-title">Manage this sheet</p>
                    <p className="av-panel-sub">
                        {sheet.open
                            ? "Closing stops new answers. Everyone can still see the results."
                            : "Reopening lets people answer again."}
                    </p>
                    <div className="av-actions">
                        {sheet.open ? (
                            <button type="button" className="av-btn av-btn--outline" onClick={handleClose}>
                                Close sheet
                            </button>
                        ) : (
                            <button type="button" className="av-btn av-btn--outline" onClick={handleReopen}>
                                Reopen sheet
                            </button>
                        )}
                        <button type="button" className="av-btn av-btn--red" onClick={handleDelete}>
                            Delete sheet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Header({ onReturn }) {
    return (
        <div className="av-header">
            <h2 className="av-title">Availabilities</h2>
            <button type="button" className="av-btn av-btn--red" onClick={onReturn}>
                Return ↩
            </button>
        </div>
    );
}
