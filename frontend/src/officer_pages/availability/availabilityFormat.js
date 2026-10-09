/*
    Date/time helpers for availability sheets.

    The backend sends dates as "2026-10-12" and times as "11:00" or "11:00:00", already in the
    sheet's time zone. They are parsed by hand: new Date("2026-10-12") means UTC midnight, which
    is the previous evening in Seattle and would show the wrong day.
*/

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-10-12" -> local Date at midnight. */
export function parseLocalDate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d);
}

/** Local Date -> "2026-10-12". */
export function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/** "11:00" / "11:30:00" -> minutes since midnight. */
export function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

/** 690 -> "11:30". */
export function minutesToTime(minutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
}

/** "13:30" -> "1:30 PM", "13:00" -> "1 PM". */
export function formatTime(time) {
    const total = typeof time === "number" ? time : timeToMinutes(time);
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    const suffix = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const weekdayShort = (isoDate) => WEEKDAYS[parseLocalDate(isoDate).getDay()];
export const weekdayLong = (isoDate) => WEEKDAYS_LONG[parseLocalDate(isoDate).getDay()];
export const monthShort = (isoDate) => MONTHS[parseLocalDate(isoDate).getMonth()];
export const dayOfMonth = (isoDate) => parseLocalDate(isoDate).getDate();
export const monthLong = (monthIndex) => MONTHS_LONG[monthIndex];

/** "Oct 12" */
export function formatShortDate(isoDate) {
    return `${monthShort(isoDate)} ${dayOfMonth(isoDate)}`;
}

/**
 * The line above the grid, e.g. "Monday, October 12 from 11 AM - 5:30 PM",
 * "Oct 12 - Oct 14, 11 AM - 1 PM", or "A typical week, 8 AM - 10 PM" for general sheets.
 */
export function describeSheetTimes(sheet) {
    const hours = `${formatTime(sheet.dayStartTime)} - ${formatTime(sheet.dayEndTime)}`;
    if (sheet.sheetType === "GENERAL") {
        return `A typical week, ${hours}`;
    }
    if (sheet.dateStart === sheet.dateEnd) {
        const d = parseLocalDate(sheet.dateStart);
        return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()} from ${hours}`;
    }
    return `${formatShortDate(sheet.dateStart)} - ${formatShortDate(sheet.dateEnd)}, ${hours}`;
}

/**
 * Month and day text for the black date badge on the sheet list.
 * One month: { month: "Sep", days: "16, 17, 18" } (or "16-22" for longer runs).
 * Two months: { month: "Sep-Oct", days: "30-2" }. General sheets: { month: "Weekly", days: "Sun-Sat" }.
 */
export function dateBadge(sheet) {
    if (sheet.sheetType === "GENERAL") {
        return { month: "Weekly", days: `${weekdayShort(sheet.dateStart)}-${weekdayShort(sheet.dateEnd)}` };
    }
    const start = parseLocalDate(sheet.dateStart);
    const end = parseLocalDate(sheet.dateEnd);
    const sameMonth = start.getMonth() === end.getMonth();
    const count = Math.round((end - start) / 86400000) + 1;

    if (!sameMonth) {
        return {
            month: `${MONTHS[start.getMonth()]}-${MONTHS[end.getMonth()]}`,
            days: `${start.getDate()}-${end.getDate()}`,
        };
    }
    if (count <= 3) {
        const days = [];
        for (let i = 0; i < count; i++) days.push(start.getDate() + i);
        return { month: MONTHS[start.getMonth()], days: days.join(", ") };
    }
    return { month: MONTHS[start.getMonth()], days: `${start.getDate()}-${end.getDate()}` };
}

/** "Closes Oct 10, 5 PM" in the viewer's own time, or null. */
export function describeDeadline(closesAt) {
    if (!closesAt) return null;
    const d = new Date(closesAt);
    const time = formatTime(d.getHours() * 60 + d.getMinutes());
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${time}`;
}

/** The viewer's IANA zone, e.g. "America/Los_Angeles". */
export function browserTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return null;
    }
}

/** "America/Los_Angeles" -> "Pacific Time" where the browser supports it, else the raw zone. */
export function timeZoneName(zone) {
    try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longGeneric" })
            .formatToParts(new Date());
        const name = parts.find((p) => p.type === "timeZoneName");
        return name ? name.value : zone;
    } catch {
        return zone;
    }
}

/**
 * Sheet list order: open sheets first, closest deadline on top (sheets without a deadline go by
 * their first day), then closed sheets, most recent first.
 */
export function sortSheets(sheets) {
    const deadlineOf = (s) => (s.closesAt ? new Date(s.closesAt).getTime() : parseLocalDate(s.dateStart).getTime());
    const open = sheets.filter((s) => s.open).sort((a, b) => deadlineOf(a) - deadlineOf(b));
    const closed = sheets.filter((s) => !s.open).sort((a, b) => deadlineOf(b) - deadlineOf(a));
    return [...open, ...closed];
}

/** What the list and badges call each sheet type. GENERAL is no longer offered when creating. */
export function categoryLabel(sheetType) {
    if (sheetType === "EVENT") return "Event";
    if (sheetType === "GENERAL") return "Weekly availability";
    return "General meeting";
}

/**
 * Splits sheets into the list's sections: open event sheets, open general meetings (older
 * "whole quarter" sheets go here too), and closed sheets. Each section keeps sortSheets order.
 */
export function groupSheets(sheets) {
    const sorted = sortSheets(sheets);
    return {
        events: sorted.filter((s) => s.open && s.sheetType === "EVENT"),
        meetings: sorted.filter((s) => s.open && s.sheetType !== "EVENT"),
        closed: sorted.filter((s) => !s.open),
    };
}

/** Column heading for a grid day: { day: "Mon", date: "Oct 12" } (no date for weekly sheets). */
export function columnLabel(isoDate, sheetType) {
    return {
        day: weekdayShort(isoDate),
        date: sheetType === "GENERAL" ? null : formatShortDate(isoDate),
    };
}

/** "Mon, Oct 12" (or just "Monday" on weekly sheets). */
export function dayLabel(isoDate, sheetType) {
    return sheetType === "GENERAL" ? weekdayLong(isoDate) : `${weekdayShort(isoDate)}, ${formatShortDate(isoDate)}`;
}

/** "Mon, Oct 12 · 11 AM - 12:30 PM" for a run of rows. */
export function describeWindow(grid, sheet, window) {
    const start = timeToMinutes(grid.times[window.startRow]);
    const end = timeToMinutes(grid.times[window.endRow]) + sheet.slotMinutes;
    return `${dayLabel(grid.dates[window.day], sheet.sheetType)} · ${formatTime(start)} - ${formatTime(end)}`;
}