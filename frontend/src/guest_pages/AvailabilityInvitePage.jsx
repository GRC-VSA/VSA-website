// src/guest_pages/AvailabilityInvitePage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
    getGuestSheet,
    inviteUrl,
    recoverGuestLink,
    submitGuestEntry,
    updateGuestEntry,
    withdrawGuestEntry,
} from "../api/Availability.js";
import AvailabilityGrid, { HeatmapLegend } from "../officer_pages/availability/AvailabilityGrid.jsx";
import {
    browserTimeZone,
    describeDeadline,
    describeSheetTimes,
    timeZoneName,
} from "../officer_pages/availability/availabilityFormat.js";
import "../officer_pages/availability/Availability.css";

/*
    The page people outside VSA open from an invite link (/availability/invite/:token).

    - No account. After the first save the backend returns an edit token; it's kept in this
      browser (localStorage) and shown as a personal edit link so they can come back.
    - A link emailed by "Lost your edit link?" arrives as ?edit=..., which is saved and then
      removed from the address bar.
    - Guests see the group heatmap and the number of responders, never names.
*/

const storageKey = (token) => `vsa-availability-edit:${token}`;

function readEditToken(token) {
    try {
        return localStorage.getItem(storageKey(token));
    } catch {
        return null;
    }
}

function writeEditToken(token, editToken) {
    try {
        if (editToken) localStorage.setItem(storageKey(token), editToken);
        else localStorage.removeItem(storageKey(token));
    } catch {
        // private browsing can block storage; the edit link still works
    }
}

export default function AvailabilityInvitePage() {
    const { token } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [view, setView] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [editToken, setEditToken] = useState(() => searchParams.get("edit") || readEditToken(token));
    const [mode, setMode] = useState("view");
    const [draft, setDraft] = useState(new Set());
    const [form, setForm] = useState({ name: "", email: "", note: "" });
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [personalLink, setPersonalLink] = useState("");
    const [saving, setSaving] = useState(false);

    // Save a token that arrived in the URL, then clean the address bar.
    useEffect(() => {
        const fromUrl = searchParams.get("edit");
        if (fromUrl) {
            writeEditToken(token, fromUrl);
            setSearchParams({}, { replace: true });
        }
    }, [token, searchParams, setSearchParams]);

    // Applies a freshly loaded view. A token that no longer matches an entry is dropped.
    const applyLoaded = useCallback(
        (data, usedToken) => {
            if (usedToken && !data.myEntry) {
                writeEditToken(token, null);
                setEditToken(null);
                setNotice("Your saved edit link no longer works. Use \"Lost your edit link?\" below to get a new one.");
            }
            setView(data);
        },
        [token]
    );

    const showLoadError = (err) =>
        setLoadError(
            err.status === 404
                ? "This link is invalid or has expired. Ask the person who sent it for a new one."
                : err.message
        );

    useEffect(() => {
        let ignore = false;
        // The URL effect above has already stored any ?edit= token by the time this runs.
        const saved = readEditToken(token);
        getGuestSheet(token, saved)
            .then((data) => !ignore && applyLoaded(data, saved))
            .catch((err) => !ignore && showLoadError(err));
        return () => {
            ignore = true;
        };
    }, [token, applyLoaded]);

    async function reload(tokenToUse) {
        try {
            applyLoaded(await getGuestSheet(token, tokenToUse), tokenToUse);
        } catch (err) {
            showLoadError(err);
        }
    }

    const mySaved = useMemo(() => new Set(view?.myEntry?.slots ?? []), [view]);

    if (loadError) {
        return (
            <GuestShell>
                <div className="av-panel">
                    <p className="av-panel-title">Availability</p>
                    <div className="av-error" style={{ marginTop: 12, marginBottom: 0 }}>{loadError}</div>
                </div>
            </GuestShell>
        );
    }
    if (!view) {
        return (
            <GuestShell>
                <p className="av-hint">Loading…</p>
            </GuestShell>
        );
    }

    const { sheet, grid, heatmap, inviteLabel, myEntry } = view;
    const viewerZone = browserTimeZone();
    const deadline = describeDeadline(sheet.closesAt);

    function startEditing() {
        setDraft(new Set(myEntry?.slots ?? []));
        setForm({ name: myEntry?.name ?? "", email: myEntry?.email ?? "", note: myEntry?.note ?? "" });
        setError("");
        setNotice("");
        setMode("edit");
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) return setError("Enter your name.");
        if (!myEntry && !form.email.trim()) return setError("Enter your email.");
        setSaving(true);
        setError("");
        try {
            const payload = { name: form.name.trim(), slots: [...draft], note: form.note.trim() || null };
            if (myEntry) {
                setView(await updateGuestEntry(token, editToken, payload));
                setNotice("Saved.");
            } else {
                const result = await submitGuestEntry(token, { ...payload, email: form.email.trim() });
                writeEditToken(token, result.editToken);
                setEditToken(result.editToken);
                setView(result.view);
                setPersonalLink(`${inviteUrl(token)}?edit=${result.editToken}`);
                setNotice("Saved. To change your answer later, use this browser or keep the personal link below.");
            }
            setMode("view");
        } catch (err) {
            if (err.status === 403) {
                writeEditToken(token, null);
                setEditToken(null);
            }
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleWithdraw() {
        if (!window.confirm("Remove your response from this sheet?")) return;
        setError("");
        try {
            await withdrawGuestEntry(token, editToken);
            writeEditToken(token, null);
            setEditToken(null);
            setPersonalLink("");
            setMode("view");
            setNotice("Your response was removed.");
            await reload(null);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <GuestShell>
            <div className="av-header">
                <h2 className="av-title">Availability</h2>
            </div>

            {error && <div className="av-error" role="alert">{error}</div>}
            {notice && <div className="av-notice" role="status">{notice}</div>}
            {personalLink && (
                <div className="av-panel" style={{ marginBottom: 18 }}>
                    <p className="av-panel-title">Your personal edit link</p>
                    <p className="av-panel-sub">Anyone with this link can change your answer, so keep it to yourself.</p>
                    <input className="av-invite-url" style={{ width: "100%" }} readOnly value={personalLink} onFocus={(e) => e.target.select()} aria-label="Your personal edit link" />
                </div>
            )}

            <div className="av-panel">
                <div className="av-sheet-head">
                    <p className="av-sheet-title">
                        {sheet.title}
                        {!sheet.open && <span className="av-chip av-chip--closed">Closed</span>}
                    </p>
                    {sheet.description && <p className="av-sheet-desc">{sheet.description}</p>}
                    <p className="av-hint" style={{ marginTop: 6 }}>
                        Organized by {sheet.createdByName} for {inviteLabel || "guests"}
                        {sheet.location && <> &nbsp;|&nbsp; Location: {sheet.location}</>}
                        {deadline && <> &nbsp;|&nbsp; {sheet.open ? "Closes" : "Closed"} {deadline}</>}
                    </p>
                </div>

                <div className="av-toolbar">
                    <div>
                        <p className="av-when">{describeSheetTimes(sheet)}</p>
                        {viewerZone && viewerZone !== sheet.timezone && (
                            <p className="av-when-sub">Times are in {timeZoneName(sheet.timezone)}</p>
                        )}
                    </div>
                    {mode === "view" && sheet.open && (
                        <button type="button" className="av-btn av-btn--green" onClick={startEditing}>
                            {myEntry ? "Edit my availability" : "Add availability"} ⊕
                        </button>
                    )}
                </div>

                {mode === "view" && !heatmap.visible && (
                    <p className="av-hidden-heatmap">
                        The group heatmap shows up once {heatmap.minResponders} people have responded
                        ({heatmap.responderCount} so far).
                    </p>
                )}

                {mode === "edit" ? (
                    <form onSubmit={handleSave}>
                        <div className="av-inline" style={{ marginBottom: 16, alignItems: "flex-end" }}>
                            <div style={{ flex: "1 1 200px" }}>
                                <label htmlFor="av-g-name" className="av-label">Your name</label>
                                <input id="av-g-name" className="av-input" maxLength={100} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div style={{ flex: "1 1 220px" }}>
                                <label htmlFor="av-g-email" className="av-label">Email</label>
                                <input
                                    id="av-g-email"
                                    type="email"
                                    className="av-input"
                                    maxLength={150}
                                    autoComplete="email"
                                    value={form.email}
                                    disabled={Boolean(myEntry)}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>
                        {!myEntry && (
                            <p className="av-hint" style={{ marginBottom: 14 }}>
                                Your email is only used to keep one answer per person and to send you an edit link if you lose it.
                            </p>
                        )}
                        <p className="av-hint" style={{ marginBottom: 10 }}>
                            Click or drag across the times you're free. Drag over green cells to clear them.
                        </p>

                        <div className="av-grid-scroll">
                            <AvailabilityGrid grid={grid} sheetType={sheet.sheetType} mode="edit" heatmap={heatmap} selection={draft} onSelectionChange={setDraft} />
                        </div>

                        <div className="av-field" style={{ marginTop: 18 }}>
                            <label htmlFor="av-g-note">Anything the organizer should know? (optional)</label>
                            <textarea id="av-g-note" className="av-textarea" maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                        </div>

                        <div className="av-footer-actions" style={{ justifyContent: "space-between" }}>
                            <span>
                                {myEntry && (
                                    <button type="button" className="av-link-btn" onClick={handleWithdraw}>
                                        Remove my response
                                    </button>
                                )}
                            </span>
                            <span className="av-actions">
                                <button type="button" className="av-btn av-btn--quiet" onClick={() => setMode("view")} disabled={saving}>
                                    Cancel ⊗
                                </button>
                                <button type="submit" className="av-btn av-btn--green" disabled={saving}>
                                    {saving ? "Saving…" : "Save ✓"}
                                </button>
                            </span>
                        </div>
                    </form>
                ) : (
                    <div className="av-grid-scroll">
                        <AvailabilityGrid grid={grid} sheetType={sheet.sheetType} mode="view" heatmap={heatmap} selection={mySaved} onSelectionChange={() => {}} />
                        <HeatmapLegend heatmap={heatmap} showMine={mySaved.size > 0} />
                    </div>
                )}
            </div>

            {!myEntry && mode === "view" && <RecoverLink token={token} />}
        </GuestShell>
    );
}

function GuestShell({ children }) {
    return (
        <div className="av-guest">
            <div className="av-page">{children}</div>
        </div>
    );
}

function RecoverLink({ token }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSending(true);
        setError("");
        try {
            const res = await recoverGuestLink(token, email.trim());
            setMessage(res.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="av-panel">
            {!open ? (
                <button type="button" className="av-link-btn" onClick={() => setOpen(true)}>
                    Already answered but lost your edit link?
                </button>
            ) : message ? (
                <p className="av-notice" style={{ marginBottom: 0 }}>{message}</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="av-panel-title">Get a new edit link</p>
                    <p className="av-panel-sub">Enter the email you answered with and we'll send you a new link. Your old link will stop working.</p>
                    {error && <div className="av-error">{error}</div>}
                    <div className="av-inline">
                        <input type="email" required className="av-input" style={{ flex: "1 1 240px" }} placeholder="you@example.com" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <button type="submit" className="av-btn av-btn--green" disabled={sending}>
                            {sending ? "Sending…" : "Email me a link"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
