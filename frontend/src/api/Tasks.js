import { API_BASE_URL } from "./config.js";
import { getTokenforAuthHeader } from "./authHeaders.js";

/*
    API calls for the officer to-do list (/api/tasks). Officer or president JWT required.

    Task shape (TaskResponse on the backend):
        {
            taskId, title, description,
            team,                                        // team name, or null if the assignee had none
            assignee: { userId, name },                  // userId is the user's UUID string
            dueDate: "2026-11-27",                       // a date, no time (LocalDate on the backend)
            priority: "LOW" | "MEDIUM" | "HIGH",
            status: "TODO" | "IN_PROGRESS" | "COMPLETED",
            assignedByName, assignedByRole,              // who assigned it
            assignedByMe,                                // true when the signed-in user assigned it
            canEdit,                                     // may edit / reassign / delete (assigner or president)
            canChangeStatus,                             // may change status (also the assignee)
            createdAt, updatedAt, completedAt,           // ISO instant strings (completedAt may be null)
            version,                                     // send back on updateTask to detect conflicting edits
        }

    Member shape (people a task can be assigned to): { userId, name, team }

    The can* flags only decide which buttons to show. The backend still checks every write and
    answers 403 if the user isn't allowed, so never treat them as security.
*/

const BASE_URL = `${API_BASE_URL}/api/tasks`;

/** Error with the backend's HTTP status, so pages can tell 403/404/409 apart. */
export class TaskApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "TaskApiError";
        this.status = status;
    }
}

async function request(url, { method = "GET", body } = {}, fallbackMessage) {
    const response = await fetch(url, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...getTokenforAuthHeader(),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        let message = fallbackMessage;
        try {
            const data = await response.json();
            if (data && data.message) message = data.message;
        } catch {
            // body was empty or not JSON; keep the fallback message
        }
        throw new TaskApiError(message, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
}

/**
    Every task the signed-in officer can see.
    @param {{ mine?: boolean, status?: string }} [filters] mine: only tasks assigned to me
*/
export function listTasks({ mine = false, status } = {}) {
    const params = new URLSearchParams();
    if (mine) params.set("mine", "true");
    if (status) params.set("status", status);
    const query = params.toString();
    return request(query ? `${BASE_URL}?${query}` : BASE_URL, {}, "Could not load tasks.");
}

/** One task. Rejects with a TaskApiError (status 404) when there is none with this id. */
export function getTask(taskId) {
    return request(`${BASE_URL}/${encodeURIComponent(taskId)}`, {}, "Could not load this task.");
}

/** People a task can be assigned to (officers and presidents). */
export function listAssignableMembers() {
    return request(`${BASE_URL}/assignable-members`, {}, "Could not load members.");
}

/**
    Assign a new task. New tasks always start as "TODO"; the backend fills in who assigned it
    from the JWT and the team from the assignee, so the page doesn't send them.

    @param {{ title: string, description: string, assigneeId: string, dueDate: string, priority: string }} task
*/
export function createTask({ title, description, assigneeId, dueDate, priority }) {
    return request(
        BASE_URL,
        { method: "POST", body: { title, description, assigneeId, dueDate, priority } },
        "Could not assign the task."
    );
}

/**
    Edit or reassign a task (assigner or president only). Pass the `version` you loaded: if
    someone else saved in between, this rejects with status 409 instead of overwriting them.

    @param {number} taskId
    @param {{ title: string, description: string, assigneeId: string, dueDate: string, priority: string, version: number }} task
*/
export function updateTask(taskId, { title, description, assigneeId, dueDate, priority, version }) {
    return request(
        `${BASE_URL}/${encodeURIComponent(taskId)}`,
        { method: "PUT", body: { title, description, assigneeId, dueDate, priority, version } },
        "Could not save the task."
    );
}

/** Move a task to "TODO", "IN_PROGRESS" or "COMPLETED". Resolves to the updated task. */
export function updateTaskStatus(taskId, status) {
    return request(
        `${BASE_URL}/${encodeURIComponent(taskId)}/status`,
        { method: "PATCH", body: { status } },
        "Could not update the status."
    );
}

/** Delete a task (assigner or president only). */
export function deleteTask(taskId) {
    return request(
        `${BASE_URL}/${encodeURIComponent(taskId)}`,
        { method: "DELETE" },
        "Could not delete the task."
    );
}
