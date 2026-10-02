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
import AvailabilityGrid, { GroupHeatmap } from "../officer_pages/availability/AvailabilityGrid.jsx";
import PageHeader from "../officer_pages/availability/PageHeader.jsx";
import { bestWindows } from "../officer_pages/availability/gridSelection.js";
import {
    browserTimeZone,
    describeDeadline,
    describeSheetTimes,
    describeWindow,
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
                <PageHeader title="Availability" showLogo={false} />
                <div className="av-error">{loadError}</div>
            </GuestShell>
        );
    }
    if (!view) {
        return (
            <GuestShell>
                <p className="av-loading">Loading…</p>
            </GuestShell>
        );
    }

    const { sheet, grid, heatmap, inviteLabel, myEntry } = view;
    const viewerZone = browserTimeZone();
    const deadline = describeDeadline(sheet.closesAt);
    const best = bestWindows(grid, heatmap);
    const twoUp = grid.dates.length <= 7;

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
            <PageHeader title={sheet.title} subtitle={`Organized by ${sheet.createdByName} for ${inviteLabel || "guests"}`} showLogo={false} />

            {error && <div className="av-error" role="alert">{error}</div>}
            {notice && <div className="av-notice" role="status">{notice}</div>}
            {personalLink && (
                <section className="av-card" style={{ marginBottom: 24 }}>
                    <h2 className="av-card-title">Your personal edit link</h2>
                    <p className="av-card-sub">Anyone with this link can change your answer, so keep it to yourself.</p>
                    <input className="av-input" readOnly value={personalLink} onFocus={(e) => e.target.select()} aria-label="Your personal edit link" />
                </section>
            )}

            <section className="av-card">
                <div className="av-detail-head">
                    <div>
                        {sheet.description && <p className="av-detail-desc" style={{ marginTop: 0 }}>{sheet.description}</p>}
                        <div className="av-detail-pills">
                            {!sheet.open && <span className="av-pill av-pill--red">Closed</span>}
                            {myEntry && <span className="av-pill av-pill--gold">✓ You answered</span>}
                        </div>
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
                    <form onSubmit={handleSave}>
                        <h2 className="av-card-title">{myEntry ? "Edit my availability" : "Add my availability"}</h2>
                        <p className="av-card-sub">
                            {myEntry
                                ? "Change your times and save."
                                : "Your email is only used to keep one answer per person and to send you an edit link if you lose it."}
                        </p>

                        <div className="av-row">
                            <div className="av-field">
                                <label htmlFor="av-g-name" className="av-label">Your name</label>
                                <input id="av-g-name" className="av-input" maxLength={100} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="av-field">
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

                        <hr className="av-divider" />

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
                            <label htmlFor="av-g-note" className="av-label">Anything the organizer should know? (optional)</label>
                            <textarea id="av-g-note" className="av-textarea" maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
                                <button type="submit" className="av-btn av-btn--primary" disabled={saving}>
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </span>
                        </div>
                    </form>
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

            {!myEntry && mode === "view" && <RecoverLink token={token} />}
        </GuestShell>
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

function GuestShell({ children }) {
    return (
        <div className="av-guest">
            <main className="av-page">{children}</main>
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
        <section className="av-card">
            {!open ? (
                <button type="button" className="av-link-btn" onClick={() => setOpen(true)}>
                    Already answered but lost your edit link?
                </button>
            ) : message ? (
                <p className="av-notice" style={{ marginBottom: 0 }}>{message}</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <h2 className="av-card-title">Get a new edit link</h2>
                    <p className="av-card-sub">Enter the email you answered with and we'll send you a new link. Your old link will stop working.</p>
                    {error && <div className="av-error">{error}</div>}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <input type="email" required className="av-input" style={{ flex: "1 1 260px", width: "auto" }} placeholder="you@example.com" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <button type="submit" className="av-btn av-btn--primary" disabled={sending}>
                            {sending ? "Sending…" : "Email me a link"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}