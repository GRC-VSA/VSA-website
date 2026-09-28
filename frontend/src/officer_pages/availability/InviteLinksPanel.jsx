// src/officer_pages/availability/InviteLinksPanel.jsx
import { useEffect, useState } from "react";
import { createInvite, inviteUrl, listInvites, revokeInvite } from "../../api/Availability.js";

/*
    Links for people outside VSA. Every officer can copy a link; the sheet's creator (or the
    president) can make new ones and turn old ones off. Turning a link off keeps the answers
    already given through it.
*/
export default function InviteLinksPanel({ sheetId, canManage }) {
    const [invites, setInvites] = useState(null);
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let ignore = false;
        listInvites(sheetId)
            .then((data) => !ignore && setInvites(data))
            .catch((err) => !ignore && setError(err.message));
        return () => {
            ignore = true;
        };
    }, [sheetId]);

    async function handleCreate(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const created = await createInvite(sheetId, { label: label.trim() || undefined });
            setInvites((prev) => [...(prev ?? []), created]);
            setLabel("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleRevoke(invite) {
        if (!window.confirm(`Turn off the "${invite.label}" link? People who already answered through it stay on the sheet.`)) {
            return;
        }
        setError("");
        try {
            const updated = await revokeInvite(invite.inviteId);
            setInvites((prev) => prev.map((i) => (i.inviteId === updated.inviteId ? updated : i)));
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCopy(invite) {
        const url = inviteUrl(invite.token);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(invite.inviteId);
            setTimeout(() => setCopiedId((id) => (id === invite.inviteId ? null : id)), 2000);
        } catch {
            // Clipboard can be blocked (e.g. plain http). The link stays selectable in the box.
            setError("Couldn't copy automatically. Select the link and copy it.");
        }
    }

    if (invites === null && !error) {
        return <p className="av-hint">Loading links…</p>;
    }

    const shown = (invites ?? []).filter((i) => i.active || canManage);

    return (
        <section aria-label="Links for people outside VSA">
            <p className="av-panel-title">Links for people outside VSA</p>
            <p className="av-panel-sub">
                Anyone with a link can add their times without an account. They see the group heatmap, never names.
            </p>

            {error && <div className="av-error">{error}</div>}

            {shown.length === 0 && <p className="av-hint">No links yet.</p>}

            {shown.map((invite) => (
                <div key={invite.inviteId} className={`av-invite${invite.active ? "" : " is-off"}`}>
                    <span className="av-invite-label">
                        {invite.label}
                        {!invite.active && " (off)"}
                    </span>
                    {invite.active && (
                        <>
                            <input
                                className="av-invite-url"
                                readOnly
                                value={inviteUrl(invite.token)}
                                onFocus={(e) => e.target.select()}
                                aria-label={`Link for ${invite.label}`}
                            />
                            <button type="button" className="av-btn av-btn--quiet av-btn--small" onClick={() => handleCopy(invite)}>
                                {copiedId === invite.inviteId ? "Copied" : "Copy link"}
                            </button>
                        </>
                    )}
                    <span className="av-hint">
                        {invite.useCount} {invite.useCount === 1 ? "response" : "responses"}
                        {invite.maxUses ? ` of ${invite.maxUses}` : ""}
                    </span>
                    {canManage && invite.active && (
                        <button type="button" className="av-link-btn" onClick={() => handleRevoke(invite)}>
                            Turn off
                        </button>
                    )}
                </div>
            ))}

            {canManage && (
                <form className="av-inline" style={{ marginTop: 14 }} onSubmit={handleCreate}>
                    <input
                        className="av-input"
                        placeholder="Who is it for? e.g. ISA collaborators"
                        value={label}
                        maxLength={100}
                        onChange={(e) => setLabel(e.target.value)}
                        aria-label="Who the new link is for"
                        style={{ flex: "1 1 220px" }}
                    />
                    <button type="submit" className="av-btn av-btn--quiet av-btn--small" disabled={busy}>
                        {busy ? "Creating…" : "Create link"}
                    </button>
                </form>
            )}
        </section>
    );
}