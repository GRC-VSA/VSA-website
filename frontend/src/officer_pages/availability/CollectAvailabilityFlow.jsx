// src/officer_pages/availability/CollectAvailabilityFlow.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInvite, createSheet } from "../../api/Availability.js";
import { getEvents } from "../../api/Events.js";
import {
    addDays,
    formatShortDate,
    formatTime,
    minutesToTime,
    monthLong,
    parseLocalDate,
    timeToMinutes,
    toIsoDate,
} from "./availabilityFormat.js";
import "./Availability.css";

/*
    Two steps, as in the Figma:
      1. What kind of sheet, and which days.
         Meeting: pick the first and last day (up to 14).
         Event:   pick an event; its date is filled in and can be widened.
         General: pick one sample week that stands for the whole quarter.
      2. Name, description, hours, deadline, and whether people outside VSA are invited.
    "Collect" creates the sheet (plus an outside link if asked) and opens it.
*/

const MAX_DAYS = 14;
const MAX_ROWS = 28;
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TYPES = [
    { value: "MEETING", label: "Meeting", hint: "Find a time for a specific meeting." },
    { value: "EVENT", label: "Event", hint: "Collect availability for one of our events." },
    { value: "GENERAL", label: "Whole quarter", hint: "One typical week, for regular check-ins all quarter." },
];

// every half hour of the day, as "HH:MM"
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => minutesToTime(i * 30));

const daysBetween = (a, b) => Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);

export default function CollectAvailabilityFlow() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [sheetType, setSheetType] = useState("MEETING");
    const [range, setRange] = useState({ start: null, end: null });
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState("");
    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        dayStartTime: "08:00",
        dayEndTime: "22:00",
        closesAt: "",
        quarterStart: "",
        quarterEnd: "",
        hasOutsideCollaborators: null,
        inviteLabel: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let ignore = false;
        const today = toIsoDate(new Date());
        getEvents()
            .then((all) => {
                if (ignore) return;
                setEvents(
                    all
                        .filter((e) => e.eventDate && e.eventDate >= today)
                        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                );
            })
            .catch(() => !ignore && setEvents([]));
        return () => {
            ignore = true;
        };
    }, []);

    const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

    function chooseType(type) {
        setSheetType(type);
        setRange({ start: null, end: null });
        setEventId("");
        setError("");
    }

    function chooseEvent(id) {
        setEventId(id);
        const event = events.find((e) => String(e.eventId) === id);
        if (event) {
            setRange({ start: event.eventDate, end: event.eventDate });
            setForm((f) => ({ ...f, title: f.title || event.title || event.eventName || "" }));
        }
    }

    function continueToDetails() {
        if (sheetType === "EVENT" && !eventId) return setError("Pick the event first.");
        if (!range.start) return setError("Pick at least one day.");
        if (sheetType === "GENERAL") {
            // Default quarter: the sample week through 11 weeks later. Editable on the next step.
            setForm((f) => ({
                ...f,
                quarterStart: f.quarterStart || range.start,
                quarterEnd: f.quarterEnd || toIsoDate(addDays(parseLocalDate(range.start), 76)),
            }));
        }
        setError("");
        setStep(2);
    }

    const startMin = timeToMinutes(form.dayStartTime);
    const endOptions = HALF_HOURS.filter((t) => {
        const m = timeToMinutes(t);
        return m > startMin && (m - startMin) / 30 <= MAX_ROWS;
    });

    function changeStart(value) {
        const newStart = timeToMinutes(value);
        const end = timeToMinutes(form.dayEndTime);
        // keep the end time valid when the start moves
        const fixedEnd = end > newStart && (end - newStart) / 30 <= MAX_ROWS ? form.dayEndTime : minutesToTime(Math.min(newStart + 120, 23 * 60 + 30));
        setForm((f) => ({ ...f, dayStartTime: value, dayEndTime: fixedEnd }));
    }

    async function handleCollect() {
        if (!form.title.trim()) return setError("Give the sheet a name.");
        if (form.hasOutsideCollaborators === null) return setError("Say whether people outside VSA are joining.");
        if (form.closesAt && new Date(form.closesAt) <= new Date()) return setError("The deadline has to be in the future.");
        if (sheetType === "GENERAL" && (!form.quarterStart || !form.quarterEnd)) {
            return setError("Enter when the quarter starts and ends.");
        }

        setError("");
        setSubmitting(true);
        let created;
        try {
            created = await createSheet({
                title: form.title.trim(),
                description: form.description.trim() || null,
                location: form.location.trim() || null,
                sheetType,
                eventId: sheetType === "EVENT" ? Number(eventId) : null,
                quarterStart: sheetType === "GENERAL" ? form.quarterStart : null,
                quarterEnd: sheetType === "GENERAL" ? form.quarterEnd : null,
                dateStart: range.start,
                dateEnd: range.end,
                dayStartTime: form.dayStartTime,
                dayEndTime: form.dayEndTime,
                slotMinutes: 30,
                closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
            });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
            return;
        }

        let createError = "";
        if (form.hasOutsideCollaborators) {
            try {
                await createInvite(created.sheet.sheetId, { label: form.inviteLabel.trim() || undefined });
            } catch (err) {
                createError = `The sheet was created, but the outside link wasn't: ${err.message} You can make one below.`;
            }
        }
        navigate(`/officer/availability/${created.sheet.sheetId}`, { state: { createError } });
    }

    return (
        <div className="av-page">
            <div className="av-header">
                <h2 className="av-title">Availabilities</h2>
                <button
                    type="button"
                    className="av-btn av-btn--red"
                    onClick={() => (step === 2 ? setStep(1) : navigate("/officer/availability"))}
                >
                    Return ↩
                </button>
            </div>

            {error && <div className="av-error" role="alert">{error}</div>}

            {step === 1 && (
                <div className="av-panel">
                    <p className="av-panel-title">What are you collecting availability for?</p>
                    <div className="av-seg" role="group" aria-label="Sheet type" style={{ margin: "8px 0 6px" }}>
                        {TYPES.map((t) => (
                            <button key={t.value} type="button" aria-pressed={sheetType === t.value} onClick={() => chooseType(t.value)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <p className="av-hint">{TYPES.find((t) => t.value === sheetType).hint}</p>

                    <hr className="av-divider" />

                    {sheetType === "EVENT" && (
                        <div className="av-field">
                            <label htmlFor="av-event">Which event?</label>
                            <select id="av-event" className="av-select" value={eventId} onChange={(e) => chooseEvent(e.target.value)}>
                                <option value="">Choose an upcoming event</option>
                                {events.map((e) => (
                                    <option key={e.eventId} value={String(e.eventId)}>
                                        {(e.title || e.eventName) + " (" + formatShortDate(e.eventDate) + ")"}
                                    </option>
                                ))}
                            </select>
                            {events.length === 0 && <p className="av-hint" style={{ marginTop: 6 }}>No upcoming events found.</p>}
                        </div>
                    )}

                    <p className="av-panel-title">
                        {sheetType === "GENERAL" ? "Pick a sample week" : "What days would you like to meet on?"}
                    </p>
                    <p className="av-panel-sub">
                        {sheetType === "GENERAL"
                            ? "Click any day to choose its week. People fill in a typical week, not these exact dates."
                            : `Click the first day, then the last day. Up to ${MAX_DAYS} days in a row.`}
                    </p>

                    <RangeCalendar
                        range={range}
                        weekMode={sheetType === "GENERAL"}
                        onChange={(next, message) => {
                            setRange(next);
                            setError(message || "");
                        }}
                    />

                    <p className="av-hint" style={{ marginTop: 14 }} aria-live="polite">
                        {range.start
                            ? range.start === range.end
                                ? `Selected: ${formatShortDate(range.start)}`
                                : `Selected: ${formatShortDate(range.start)} to ${formatShortDate(range.end)} (${daysBetween(range.start, range.end) + 1} days)`
                            : "No days selected yet."}
                    </p>

                    <div className="av-footer-actions">
                        <button type="button" className="av-btn av-btn--green" onClick={continueToDetails}>
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="av-panel">
                    <div className="av-field">
                        <label htmlFor="av-title">
                            {sheetType === "GENERAL" ? "Sheet name" : sheetType === "EVENT" ? "Event name" : "Meeting name"}
                        </label>
                        <input
                            id="av-title"
                            className="av-input"
                            maxLength={150}
                            value={form.title}
                            placeholder={sheetType === "GENERAL" ? "Fall 2026 weekly availability" : "Badminton Tournament"}
                            onChange={(e) => update("title", e.target.value)}
                        />
                    </div>

                    <div className="av-field">
                        <label htmlFor="av-desc">What's it about?</label>
                        <input
                            id="av-desc"
                            className="av-input"
                            maxLength={2000}
                            value={form.description}
                            placeholder="Fill out your availability for…"
                            onChange={(e) => update("description", e.target.value)}
                        />
                    </div>

                    <div className="av-field">
                        <label htmlFor="av-location">Location (optional)</label>
                        <input
                            id="av-location"
                            className="av-input"
                            maxLength={200}
                            value={form.location}
                            placeholder={sheetType === "EVENT" ? "Leave empty to use the event's location" : "SH 152"}
                            onChange={(e) => update("location", e.target.value)}
                        />
                    </div>

                    <div className="av-field">
                        <span className="av-label" id="av-hours-label">What time would you like to meet between?</span>
                        <div className="av-inline" role="group" aria-labelledby="av-hours-label">
                            <select className="av-select" aria-label="From" value={form.dayStartTime} onChange={(e) => changeStart(e.target.value)}>
                                {HALF_HOURS.slice(0, 47).map((t) => (
                                    <option key={t} value={t}>{formatTime(t)}</option>
                                ))}
                            </select>
                            <span className="av-hint">to</span>
                            <select className="av-select" aria-label="To" value={form.dayEndTime} onChange={(e) => update("dayEndTime", e.target.value)}>
                                {endOptions.map((t) => (
                                    <option key={t} value={t}>{formatTime(t)}</option>
                                ))}
                            </select>
                        </div>
                        <p className="av-hint" style={{ marginTop: 6 }}>Up to 14 hours, so the grid fits on a phone.</p>
                    </div>

                    {sheetType === "GENERAL" && (
                        <div className="av-field">
                            <span className="av-label" id="av-quarter-label">Which quarter does this cover?</span>
                            <div className="av-inline" role="group" aria-labelledby="av-quarter-label">
                                <input type="date" className="av-input" aria-label="Quarter starts" value={form.quarterStart} onChange={(e) => update("quarterStart", e.target.value)} />
                                <span className="av-hint">to</span>
                                <input type="date" className="av-input" aria-label="Quarter ends" value={form.quarterEnd} onChange={(e) => update("quarterEnd", e.target.value)} />
                            </div>
                            <p className="av-hint" style={{ marginTop: 6 }}>The sample week has to fall inside the quarter.</p>
                        </div>
                    )}

                    <div className="av-field">
                        <label htmlFor="av-deadline">Stop collecting answers on (optional)</label>
                        <input
                            id="av-deadline"
                            type="datetime-local"
                            className="av-input"
                            value={form.closesAt}
                            onChange={(e) => update("closesAt", e.target.value)}
                        />
                    </div>

                    <fieldset className="av-field" style={{ border: "none" }}>
                        <legend className="av-label">Does this meeting have collaborators from outside VSA?</legend>
                        <label className="av-choice">
                            <input
                                type="radio"
                                name="outside"
                                checked={form.hasOutsideCollaborators === true}
                                onChange={() => update("hasOutsideCollaborators", true)}
                            />
                            Yes
                        </label>
                        <label className="av-choice">
                            <input
                                type="radio"
                                name="outside"
                                checked={form.hasOutsideCollaborators === false}
                                onChange={() => update("hasOutsideCollaborators", false)}
                            />
                            No
                        </label>
                        {form.hasOutsideCollaborators && (
                            <div style={{ marginTop: 12 }}>
                                <label htmlFor="av-invite-label" className="av-label">Who are they?</label>
                                <input
                                    id="av-invite-label"
                                    className="av-input"
                                    maxLength={100}
                                    placeholder="ISA collaborators"
                                    value={form.inviteLabel}
                                    onChange={(e) => update("inviteLabel", e.target.value)}
                                />
                                <p className="av-hint" style={{ marginTop: 6 }}>
                                    You'll get a link to send them. This name shows next to their answers.
                                </p>
                            </div>
                        )}
                    </fieldset>

                    <div className="av-footer-actions">
                        <button type="button" className="av-btn av-btn--green" onClick={handleCollect} disabled={submitting}>
                            {submitting ? "Collecting…" : "Collect →"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/*
    Month calendar. Range mode: first click sets the start (and a one-day range), second click
    sets the end. Week mode: any click selects that Sunday-to-Saturday row.
*/
function RangeCalendar({ range, weekMode, onChange }) {
    const initial = range.start ? parseLocalDate(range.start) : new Date();
    const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
    const [picking, setPicking] = useState(false);
    const today = toIsoDate(new Date());

    const first = new Date(view.year, view.month, 1);
    const gridStart = addDays(first, -first.getDay());
    const weeks = [];
    for (let w = 0; w < 6; w++) {
        const days = Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i));
        if (w > 3 && days[0].getMonth() !== view.month) break;
        weeks.push(days);
    }

    function shiftMonth(delta) {
        setView(({ year, month }) => {
            const d = new Date(year, month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    }

    function pick(iso) {
        if (weekMode) {
            const d = parseLocalDate(iso);
            const sunday = addDays(d, -d.getDay());
            onChange({ start: toIsoDate(sunday), end: toIsoDate(addDays(sunday, 6)) });
            return;
        }
        if (!picking || !range.start) {
            onChange({ start: iso, end: iso });
            setPicking(true);
            return;
        }
        const [start, end] = iso < range.start ? [iso, range.start] : [range.start, iso];
        if (daysBetween(start, end) + 1 > MAX_DAYS) {
            onChange({ start: iso, end: iso }, `A sheet can cover at most ${MAX_DAYS} days in a row. Started a new range.`);
            return;
        }
        onChange({ start, end });
        setPicking(false);
    }

    return (
        <div className="av-cal">
            <div className="av-cal-nav">
                <button type="button" className="av-btn av-btn--quiet av-btn--small" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                    ‹
                </button>
                <span className="av-cal-month" aria-live="polite">
                    {monthLong(view.month)} {view.year}
                </span>
                <button type="button" className="av-btn av-btn--quiet av-btn--small" onClick={() => shiftMonth(1)} aria-label="Next month">
                    ›
                </button>
            </div>

            <div className="av-cal-grid">
                {DOW.map((d) => (
                    <div key={d} className="av-cal-dow">{d}</div>
                ))}
                {weeks.flat().map((date) => {
                    const iso = toIsoDate(date);
                    const inMonth = date.getMonth() === view.month;
                    const inRange = range.start && iso >= range.start && iso <= range.end;
                    const isStart = iso === range.start;
                    const isEnd = iso === range.end;
                    const cellClasses = ["av-cal-cell"];
                    if (inRange && !isStart && !isEnd) cellClasses.push("in-range");
                    if (isStart && range.start !== range.end) cellClasses.push("range-start");
                    if (isEnd && range.start !== range.end) cellClasses.push("range-end");
                    const dayClasses = ["av-cal-day"];
                    if (isStart || isEnd) dayClasses.push("is-edge");
                    if (iso < today || !inMonth) dayClasses.push("is-past");
                    if (iso === today) dayClasses.push("is-today");

                    return (
                        <div key={iso} className={cellClasses.join(" ")}>
                            <button
                                type="button"
                                className={dayClasses.join(" ")}
                                aria-pressed={Boolean(inRange)}
                                aria-label={`${monthLong(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`}
                                onClick={() => pick(iso)}
                            >
                                {date.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
