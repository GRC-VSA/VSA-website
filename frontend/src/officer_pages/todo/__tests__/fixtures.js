import { addDays, toIsoDate } from "../../availability/availabilityFormat.js";

/** "2026-11-27"-style date `days` from today, so tests don't go stale. */
export const dayFromToday = (days) => toIsoDate(addDays(new Date(), days));

export const task = (over = {}) => ({
    taskId: 1,
    title: "Prepare volunteer briefing",
    description: "Prepare the volunteer roles and check-in instructions.",
    team: "Event Organizing",
    assignee: { userId: "u-linh", name: "Linh Nguyen" },
    dueDate: dayFromToday(2),
    priority: "HIGH",
    status: "TODO",
    assignedByName: "An Nguyen",
    assignedByRole: "Executive officer",
    assignedByMe: false,
    canEdit: false,
    canChangeStatus: false,
    completedAt: null,
    version: 0,
    createdAt: new Date(2026, 10, 25, 12).toISOString(),
    ...over,
});

/** userIds are UUID strings in the real API; short strings here keep tests readable. */
export const members = [
    { userId: "u-linh", name: "Linh Nguyen", team: "Marketing" },
    { userId: "u-minh", name: "Minh Tran", team: "Event Organizing" },
];
