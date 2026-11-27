import { addDays, parseLocalDate, toIsoDate } from "../availability/availabilityFormat.js";

/*
    Labels, date helpers and list logic for the to-do list pages.

    Due dates are plain dates ("2026-11-27"), compared as strings against today's local date, so
    a task due today is never shown as overdue because of the time of day or the time zone.
*/

export const STATUS_LABELS = {
    TODO: "To do",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
};

export const PRIORITY_LABELS = {
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
};

/** Workflow order, the order the status buttons show them in. */
export const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"];

/** Lowest to highest, the order the priority picker shows them in. */
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-27" -> "Nov 27, 2026". */
export function formatDate(isoDate) {
    const date = parseLocalDate(isoDate);
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** ISO instant ("2026-11-25T07:30:00Z") -> its local date, "Nov 24, 2026" in Seattle. */
export const formatInstantDate = (instant) => formatDate(toIsoDate(new Date(instant)));

/** Today's local date as "2026-11-25". */
export const todayIso = (now = new Date()) => toIsoDate(now);

export const isOpen = (task) => task.status !== "COMPLETED";

/** "overdue", "today", or null. Completed tasks are never overdue. */
export function dueState(task, today = todayIso()) {
    if (!isOpen(task)) return null;
    if (task.dueDate < today) return "overdue";
    if (task.dueDate === today) return "today";
    return null;
}

/** Open tasks first, soonest due date first; completed tasks last. Doesn't change the input. */
export function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
        return a.dueDate.localeCompare(b.dueDate) || a.taskId - b.taskId;
    });
}

/** Numbers for the three summary cards. "Due in 7 days" counts today through 7 days from now. */
export function summarize(tasks, today = todayIso()) {
    const weekOut = toIsoDate(addDays(parseLocalDate(today), 7));
    const open = tasks.filter(isOpen);
    return {
        open: open.length,
        dueSoon: open.filter((t) => t.dueDate >= today && t.dueDate <= weekOut).length,
        overdue: open.filter((t) => t.dueDate < today).length,
    };
}

/** CSS modifier for a status pill. */
export const statusClass = (status) => `td-status--${status.toLowerCase().replace("_", "-")}`;
