import { addDays, toIsoDate } from "../officer_pages/availability/availabilityFormat.js";

/*
    API calls for the officer to-do list.

    TEMPORARY MOCK: there is no backend for tasks yet. These functions keep data in memory (it
    resets on page reload) so the pages can be built and tested. When the backend lands, replace
    each body with a fetch to /api/tasks using getTokenforAuthHeader() (see api/Availability.js),
    keeping the same names, arguments and return shapes so the pages don't change.

    Task shape:
        {
            taskId, title, description, team,
            assignee: { userId, name },
            dueDate: "2026-11-27",                       // a date, no time (LocalDate on the backend)
            priority: "LOW" | "MEDIUM" | "HIGH",
            status: "TODO" | "IN_PROGRESS" | "COMPLETED",
            assignedByName, assignedByRole,              // who assigned it
            assignedByMe,                                // true when the signed-in user assigned it
            createdAt: ISO instant string,
        }

    Member shape (people a task can be assigned to): { userId, name, team }
*/

const MEMBERS = [
    { userId: 1, name: "Linh Nguyen", team: "Marketing" },
    { userId: 2, name: "Minh Tran", team: "Event Organizing" },
    { userId: 3, name: "Bao Pham", team: "Event Organizing" },
    { userId: 4, name: "Mai Le", team: "Performing Arts" },
    { userId: 5, name: "An Nguyen", team: "Executive Board" },
];

/** Sample tasks, with due dates relative to today so "Overdue" and "Today" always show. */
function seedTasks() {
    const today = new Date();
    const due = (days) => toIsoDate(addDays(today, days));
    const created = addDays(today, -3).toISOString();
    const member = (userId) => {
        const { name } = MEMBERS.find((m) => m.userId === userId);
        return { userId, name };
    };
    const base = { assignedByName: "An Nguyen", assignedByRole: "Executive officer", assignedByMe: false, createdAt: created };

    return [
        { ...base, taskId: 1, title: "Confirm venue booking", team: "Event Organizing", assignee: member(2), dueDate: due(-1), priority: "HIGH", status: "IN_PROGRESS",
            description: "Call the venue to confirm the date, the room setup and the deposit." },
        { ...base, taskId: 2, title: "Finalize tournament format", team: "Event Organizing", assignee: member(3), dueDate: due(0), priority: "HIGH", status: "IN_PROGRESS",
            description: "Decide the bracket format and match length, then share it with the event team." },
        { ...base, taskId: 3, title: "Prepare event announcement", team: "Marketing", assignee: member(1), dueDate: due(2), priority: "MEDIUM", status: "TODO",
            description: "Write the announcement post and design the poster for the next event." },
        { ...base, taskId: 4, title: "Confirm performance lineup", team: "Performing Arts", assignee: member(4), dueDate: due(6), priority: "MEDIUM", status: "TODO",
            description: "Confirm every act, its order and its length with the performers." },
        { ...base, taskId: 5, title: "Share meeting notes", team: "Executive Board", assignee: member(5), dueDate: due(-2), priority: "LOW", status: "COMPLETED",
            description: "Send the notes from the last board meeting to all officers." },
    ];
}

let tasks = seedTasks();
let nextTaskId = tasks.length + 1;

const copy = (value) => structuredClone(value);

/** Every task the signed-in officer can see. */
export async function listTasks() {
    return copy(tasks);
}

/** One task. Rejects with "Task not found" when there is none with this id. */
export async function getTask(taskId) {
    const task = tasks.find((t) => String(t.taskId) === String(taskId));
    if (!task) throw new Error("Task not found");
    return copy(task);
}

/** People a task can be assigned to. */
export async function listAssignableMembers() {
    return copy(MEMBERS);
}

/**
    Assign a new task. New tasks always start as "TODO"; the backend will fill in who assigned it
    from the JWT, so the page doesn't send it.

    @param {{ title: string, description: string, assigneeId: number, dueDate: string, priority: string }} task
*/
export async function createTask({ title, description, assigneeId, dueDate, priority }) {
    const member = MEMBERS.find((m) => m.userId === assigneeId);
    if (!member) throw new Error("Choose a member to assign this task to");

    const task = {
        taskId: nextTaskId++,
        title,
        description,
        team: member.team,
        assignee: { userId: member.userId, name: member.name },
        dueDate,
        priority,
        status: "TODO",
        assignedByName: null,
        assignedByRole: null,
        assignedByMe: true,
        createdAt: new Date().toISOString(),
    };
    tasks = [...tasks, task];
    return copy(task);
}

/** Test helper: put the sample data back. */
export function resetMockTasks() {
    tasks = seedTasks();
    nextTaskId = tasks.length + 1;
}
