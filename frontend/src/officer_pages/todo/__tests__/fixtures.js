import { addDays, toIsoDate } from "../../availability/availabilityFormat.js";

/** "2026-11-27"-style date `days` from today, so tests don't go stale. */
export const dayFromToday = (days) => toIsoDate(addDays(new Date(), days));

export const task = (over = {}) => ({
    taskId: 1,
    title: "Prepare volunteer briefing",
    description: "Prepare the volunteer roles and check-in instructions.",
    team: "Event Organizing",
    assignee: { userId: 1, name: "Linh Nguyen" },
    dueDate: dayFromToday(2),
    priority: "HIGH",
    status: "TODO",
    assignedByName: "An Nguyen",
    assignedByRole: "Executive officer",
    assignedByMe: false,
    createdAt: new Date(2026, 10, 25, 12).toISOString(),
    ...over,
});

export const members = [
    { userId: 1, name: "Linh Nguyen", team: "Marketing" },
    { userId: 2, name: "Minh Tran", team: "Event Organizing" },
];
