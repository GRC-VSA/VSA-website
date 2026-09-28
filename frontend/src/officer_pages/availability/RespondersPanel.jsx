// src/officer_pages/availability/RespondersPanel.jsx

/*
    Who has answered. Officers who haven't answered yet are greyed out (from the Figma).
    Names are shown to officers only; the heatmap never says who picked which time.
*/
export default function RespondersPanel({ responders, canManage, onRemove }) {
    const people = responders.people;
    const officers = people.filter((p) => !p.guest);
    const guests = people.filter((p) => p.guest);

    return (
        <aside className="av-responders" aria-label="Responders">
            <p className="av-responders-title">
                Responders ({responders.respondedOfficers}/{responders.expectedOfficers})
                {responders.guests > 0 && (
                    <span className="av-responders-sub"> + {responders.guests} outside</span>
                )}
            </p>

            <div className="av-responders-grid">
                {officers.map((p) => (
                    <Person key={p.participantId ?? `pending-${p.name}`} person={p} canManage={canManage} onRemove={onRemove} />
                ))}
            </div>

            {guests.length > 0 && (
                <>
                    <p className="av-responders-group">From outside VSA</p>
                    <div className="av-responders-grid">
                        {guests.map((p) => (
                            <Person key={p.participantId} person={p} canManage={canManage} onRemove={onRemove} showRole />
                        ))}
                    </div>
                </>
            )}
        </aside>
    );
}

function Person({ person, canManage, onRemove, showRole }) {
    return (
        <div className={`av-person${person.responded ? "" : " is-pending"}`}>
            <span className="av-person-name">
                {person.name}
                {showRole && person.roleLabel && <span className="av-person-role">{person.roleLabel}</span>}
            </span>
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
        </div>
    );
}
