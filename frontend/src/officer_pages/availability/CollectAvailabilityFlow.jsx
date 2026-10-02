// src/officer_pages/availability/CollectAvailabilityFlow.jsx
import { useEffect, useRef, useState } from "react";
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
import PageHeader from "./PageHeader.jsx";
import "./Availability.css";

/*
    One form, laid out like Create Events:
      1. What it's for: a general meeting, or one of our events (its date fills in).
      2. Which days (one or more in a row) and which hours.
      3. Name, description, location, deadline.
      4. Whether people outside VSA get a link.
    The two kinds only differ in how they're grouped on the list and that an event sheet is
    tied to the event.
*/

const MAX_DAYS = 14;
const MAX_ROWS = 28;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => minutesToTime(i * 30));
const daysBetween = (a, b) => Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
const eventName = (e) => e.eventName || e.title || "Untitled event";

export default function CollectAvailabilityFlow() {
    const navigate = useNavigate();
    const errorRef = useRef(null);
    const [kind, setKind] = useState("MEETING");
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState("");
    const [range, setRange] = useState({ start: null, end: null });
    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        dayStartTime: "08:00",
        dayEndTime: "22:00",
        closesAt: "",
        outside: false,
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

    function showError(message) {
        setError(message);
        // the message sits at the top of a long form; bring it into view
        requestAnimationFrame(() => errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }));
    }

    function chooseKind(next) {
        setKind(next);
        setEventId("");
        setError("");
    }

    function chooseEvent(id) {
        setEventId(id);
        const event = events.find((e) => String(e.eventId) === id);
        if (event) {
            setRange({ start: event.eventDate, end: event.eventDate });
            setForm((f) => ({ ...f, title: f.title || `${eventName(event)} availability` }));
        }
    }

    const startMin = timeToMinutes(form.dayStartTime);
    const endOptions = HALF_HOURS.filter((t) => {
        const m = timeToMinutes(t);
        return m > startMin && (m - startMin) / 30 <= MAX_ROWS;
    });

    function changeStart(value) {
        const newStart = timeToMinutes(value);
        const end = timeToMinutes(form.dayEndTime);
        const fixedEnd =
            end > newStart && (end - newStart) / 30 <= MAX_ROWS
                ? form.dayEndTime
                : minutesToTime(Math.min(newStart + 120, 23 * 60 + 30));
        setForm((f) => ({ ...f, dayStartTime: value, dayEndTime: fixedEnd }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (kind === "EVENT" && !eventId) return showError("Pick the event this is for.");
        if (!range.start) return showError("Pick at least one day on the calendar.");
        if (!form.title.trim()) return showError("Give the sheet a name.");
        if (form.closesAt && new Date(form.closesAt) <= new Date()) return showError("The deadline has to be in the future.");

        setError("");
        setSubmitting(true);
        let created;
        try {
            created = await createSheet({
                title: form.title.trim(),
                description: form.description.trim() || null,
                location: form.location.trim() || null,
                sheetType: kind,
                eventId: kind === "EVENT" ? Number(eventId) : null,
                quarterStart: null,
                quarterEnd: null,
                dateStart: range.start,
                dateEnd: range.end,
                dayStartTime: form.dayStartTime,
                dayEndTime: form.dayEndTime,
                slotMinutes: 30,
                closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
            });
        } catch (err) {
            setSubmitting(false);
            return showError(err.message);
        }

        let createError = "";
        if (form.outside) {
            try {
                await createInvite(created.sheet.sheetId, { label: form.inviteLabel.trim() || undefined });
            } catch (err) {
                createError = `The sheet was created, but the outside link wasn't: ${err.message} You can make one below.`;
            }
        }
        navigate(`/officer/availability/${created.sheet.sheetId}`, { state: { createError } });
    }

    const rows = (timeToMinutes(form.dayEndTime) - startMin) / 30;

    return (
        <main className="av-page">
            <PageHeader
                title="Collect availability"
                subtitle="Ask officers (and anyone else) when they're free"
                onBack={() => navigate("/officer/availability")}
            />

            <div ref={errorRef}>{error && <div className="av-error" role="alert">{error}</div>}</div>

            <form className="av-card" onSubmit={handleSubmit} noValidate>
                {/* 1. What it's for */}
                <h2 className="av-section-title">What is it for?</h2>
                <p className="av-section-sub">This decides where the sheet is listed.</p>
                <div className="av-choices" role="group" aria-label="What the sheet is for">
                    <button type="button" className="av-choice" aria-pressed={kind === "MEETING"} onClick={() => chooseKind("MEETING")}>
                        <span className="av-choice-title">General meeting</span>
                        <span className="av-choice-sub">Board meetings, check-ins, planning sessions, shoots.</span>
                    </button>
                    <button type="button" className="av-choice" aria-pressed={kind === "EVENT"} onClick={() => chooseKind("EVENT")}>
                        <span className="av-choice-title">Event</span>
                        <span className="av-choice-sub">Staffing or volunteers for an event on our calendar.</span>
                    </button>
                </div>

                {kind === "EVENT" && (
                    <div className="av-field" style={{ marginTop: 18 }}>
                        <label className="av-label" htmlFor="av-event">Which event?</label>
                        <select id="av-event" className="av-select" value={eventId} onChange={(e) => chooseEvent(e.target.value)}>
                            <option value="">Choose an upcoming event</option>
                            {events.map((e) => (
                                <option key={e.eventId} value={String(e.eventId)}>
                                    {eventName(e)} · {formatShortDate(e.eventDate)}
                                </option>
                            ))}
                        </select>
                        {events.length === 0 && (
                            <p className="av-hint">No upcoming events. Create the event first, or use General meeting.</p>
                        )}
                    </div>
                )}

                <hr className="av-divider" />

                {/* 2. When */}
                <h2 className="av-section-title">When?</h2>
                <p className="av-section-sub">
                    Click the first day, then the last day (up to {MAX_DAYS} in a row). Click one day twice for a single day.
                </p>
                <RangeCalendar
                    key={eventId || "free"} /* reopen on the event's month when one is picked */
                    range={range}
                    onChange={(next, message) => {
                        setRange(next);
                        setError(message || "");
                    }}
                />
                <p className="av-hint" style={{ margin: "14px 0 22px" }} aria-live="polite">
                    {range.start
                        ? range.start === range.end
                            ? `Selected: ${formatShortDate(range.start)}`
                            : `Selected: ${formatShortDate(range.start)} to ${formatShortDate(range.end)} (${daysBetween(range.start, range.end) + 1} days)`
                        : "No days selected yet."}
                </p>

                <div className="av-row">
                    <div className="av-field">
                        <label className="av-label" htmlFor="av-from">Earliest time</label>
                        <select id="av-from" className="av-select" value={form.dayStartTime} onChange={(e) => changeStart(e.target.value)}>
                            {HALF_HOURS.slice(0, 47).map((t) => (
                                <option key={t} value={t}>{formatTime(t)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="av-field">
                        <label className="av-label" htmlFor="av-to">Latest time</label>
                        <select id="av-to" className="av-select" value={form.dayEndTime} onChange={(e) => update("dayEndTime", e.target.value)}>
                            {endOptions.map((t) => (
                                <option key={t} value={t}>{formatTime(t)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="av-hint">
                    {rows / 2} hours a day, in 30-minute blocks. Up to 14 hours so the grid fits on a phone.
                </p>

                <hr className="av-divider" />

                {/* 3. Details */}
                <h2 className="av-section-title">Details</h2>
                <p className="av-section-sub">What people see when they open the sheet.</p>
                <div className="av-field">
                    <label className="av-label" htmlFor="av-title">Name</label>
                    <input
                        id="av-title"
                        className="av-input"
                        maxLength={150}
                        value={form.title}
                        placeholder={kind === "EVENT" ? "Badminton Tournament volunteers" : "Discussing format for Badminton Tournament"}
                        onChange={(e) => update("title", e.target.value)}
                    />
                </div>
                <div className="av-field">
                    <label className="av-label" htmlFor="av-desc">Description (optional)</label>
                    <textarea
                        id="av-desc"
                        className="av-textarea"
                        maxLength={2000}
                        value={form.description}
                        placeholder="What's this meeting about?"
                        onChange={(e) => update("description", e.target.value)}
                    />
                </div>
                <div className="av-row">
                    <div className="av-field">
                        <label className="av-label" htmlFor="av-location">Location (optional)</label>
                        <input
                            id="av-location"
                            className="av-input"
                            maxLength={200}
                            value={form.location}
                            placeholder={kind === "EVENT" ? "Leave empty to use the event's location" : "SH 152"}
                            onChange={(e) => update("location", e.target.value)}
                        />
                    </div>
                    <div className="av-field">
                        <label className="av-label" htmlFor="av-deadline">Stop collecting on (optional)</label>
                        <input
                            id="av-deadline"
                            type="datetime-local"
                            className="av-input"
                            value={form.closesAt}
                            onChange={(e) => update("closesAt", e.target.value)}
                        />
                    </div>
                </div>

                <hr className="av-divider" />

                {/* 4. Outside VSA */}
                <h2 className="av-section-title">People outside VSA</h2>
                <p className="av-section-sub">
                    Collaborators or volunteers without a VSA officer account can answer through a link.
                </p>
                <div className="av-choices" role="group" aria-label="Invite people outside VSA">
                    <button type="button" className="av-choice" aria-pressed={!form.outside} onClick={() => update("outside", false)}>
                        <span className="av-choice-title">Officers only</span>
                        <span className="av-choice-sub">You can still add a link later.</span>
                    </button>
                    <button type="button" className="av-choice" aria-pressed={form.outside} onClick={() => update("outside", true)}>
                        <span className="av-choice-title">Also people outside VSA</span>
                        <span className="av-choice-sub">You'll get a link to send them.</span>
                    </button>
                </div>
                {form.outside && (
                    <div className="av-field" style={{ marginTop: 18 }}>
                        <label className="av-label" htmlFor="av-invite-label">Who are they?</label>
                        <input
                            id="av-invite-label"
                            className="av-input"
                            maxLength={100}
                            placeholder="ISA collaborators"
                            value={form.inviteLabel}
                            onChange={(e) => update("inviteLabel", e.target.value)}
                        />
                        <p className="av-hint">Shown next to their names in the responses.</p>
                    </div>
                )}

                <div className="av-form-actions">
                    <button type="button" className="av-btn av-btn--ghost" onClick={() => navigate("/officer/availability")}>
                        Cancel
                    </button>
                    <button type="submit" className="av-btn av-btn--primary" disabled={submitting}>
                        {submitting ? "Creating…" : "Start collecting"}
                    </button>
                </div>
            </form>
        </main>
    );
}

/*
    Month calendar. First click sets the start (a one-day range); the second click sets the end.
*/
function RangeCalendar({ range, onChange }) {
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
                <button type="button" className="av-cal-arrow" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
                <span className="av-cal-month" aria-live="polite">
                    {monthLong(view.month)} {view.year}
                </span>
                <button type="button" className="av-cal-arrow" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
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
                    const cell = ["av-cal-cell"];
                    if (inRange && !isStart && !isEnd) cell.push("in-range");
                    if (isStart && range.start !== range.end) cell.push("range-start");
                    if (isEnd && range.start !== range.end) cell.push("range-end");
                    const day = ["av-cal-day"];
                    if (isStart || isEnd) day.push("is-edge");
                    if (iso < today || !inMonth) day.push("is-muted");
                    if (iso === today) day.push("is-today");
                    return (
                        <div key={iso} className={cell.join(" ")}>
                            <button
                                type="button"
                                className={day.join(" ")}
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