// src/officer_pages/availability/RespondersPanel.jsx

/*
    Who has answered. Officers who haven't answered yet show as dashed outlines.
    Names are shown to officers only; the heatmap never says who picked which time.
*/
export default function RespondersPanel({ responders, canManage, onRemove }) {
    const officers = responders.people.filter((p) => !p.guest);
    const guests = responders.people.filter((p) => p.guest);
    const pct = responders.expectedOfficers
        ? Math.round((responders.respondedOfficers / responders.expectedOfficers) * 100)
        : 0;

    return (
        <section className="av-card" aria-labelledby="av-responders-title">
            <div className="av-responders-head">
                <h2 className="av-card-title" id="av-responders-title">Responses</h2>
                <span className="av-hint">
                    {responders.respondedOfficers} of {responders.expectedOfficers} officers
                    {responders.guests > 0 && ` · ${responders.guests} from outside VSA`}
                </span>
            </div>
            <div className="av-progress" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
            </div>

            <div className="av-people">
                {officers.map((p) => (
                    <Person key={p.participantId ?? `pending-${p.name}`} person={p} canManage={canManage} onRemove={onRemove} />
                ))}
            </div>

            {guests.length > 0 && (
                <>
                    <p className="av-subhead">From outside VSA</p>
                    <div className="av-people">
                        {guests.map((p) => (
                            <Person key={p.participantId} person={p} canManage={canManage} onRemove={onRemove} showRole />
                        ))}
                    </div>
                </>
            )}

            <p className="av-hint" style={{ marginTop: 16 }}>
                Dashed names haven't answered yet. Names are never linked to specific times.
            </p>
        </section>
    );
}

function Person({ person, canManage, onRemove, showRole }) {
    return (
        <span className={`av-person${person.responded ? "" : " is-pending"}`}>
            {person.name}
            {showRole && person.roleLabel && <span className="av-person-role">· {person.roleLabel}</span>}
            {person.note && (
                <span className="av-person-note" title={person.note} aria-label={`Note: ${person.note}`}>
                    ✎
                </span>
            )}
            {canManage && person.responded && person.participantId && (
                <button
                    type="button"
                    className="av-person-remove"
                    title={`Remove ${person.name}'s response`}
                    aria-label={`Remove ${person.name}'s response`}
                    onClick={() => onRemove(person)}
                >
                    ✕
                </button>
            )}
        </span>
    );
}