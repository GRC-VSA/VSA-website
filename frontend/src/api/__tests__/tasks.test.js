import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as api from "../Tasks.js";

const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status, body) => ({
    ok: false,
    status,
    json: body === undefined ? async () => { throw new Error("no body"); } : async () => body,
});

describe("Tasks API", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        localStorage.clear();
        localStorage.setItem("token", "jwt-1");
    });
    afterEach(() => vi.restoreAllMocks());

    const lastCall = () => fetch.mock.calls[0];

    it("listTasks sends the bearer token, no body, and no filters by default", async () => {
        fetch.mockResolvedValue(ok([]));
        await expect(api.listTasks()).resolves.toEqual([]);
        expect(lastCall()[0]).toMatch(/\/api\/tasks$/);
        expect(lastCall()[1].method).toBe("GET");
        expect(lastCall()[1].headers.Authorization).toBe("Bearer jwt-1");
        expect(lastCall()[1].body).toBeUndefined();
        expect(lastCall()[1].headers["Content-Type"]).toBeUndefined();
    });

    it("listTasks passes mine and status filters as query params", async () => {
        fetch.mockResolvedValue(ok([]));
        await api.listTasks({ mine: true, status: "TODO" });
        expect(lastCall()[0]).toMatch(/\/api\/tasks\?mine=true&status=TODO$/);
    });

    it.each([
        ["getTask", () => api.getTask(7), "GET", "/7"],
        ["listAssignableMembers", () => api.listAssignableMembers(), "GET", "/assignable-members"],
    ])("%s", async (_name, call, method, path) => {
        fetch.mockResolvedValue(ok({ a: 1 }));
        await expect(call()).resolves.toEqual({ a: 1 });
        expect(lastCall()[0]).toMatch(new RegExp(`/api/tasks${path}$`));
        expect(lastCall()[1].method).toBe(method);
    });

    it("createTask posts only the fields the client owns", async () => {
        fetch.mockResolvedValue(ok({ taskId: 1 }, 201));
        await api.createTask({
            title: "T", description: "D", assigneeId: "u-1", dueDate: "2030-01-02", priority: "HIGH",
            status: "COMPLETED", assignedByName: "Someone else",
        });
        expect(lastCall()[1].method).toBe("POST");
        expect(lastCall()[1].headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(lastCall()[1].body)).toEqual({
            title: "T", description: "D", assigneeId: "u-1", dueDate: "2030-01-02", priority: "HIGH",
        });
    });

    it("updateTask PUTs the edit with the version it was loaded at", async () => {
        fetch.mockResolvedValue(ok({ taskId: 7 }));
        await api.updateTask(7, { title: "T", description: "", assigneeId: "u-2", dueDate: "2030-01-02", priority: "LOW", version: 3 });
        expect(lastCall()[0]).toMatch(/\/api\/tasks\/7$/);
        expect(lastCall()[1].method).toBe("PUT");
        expect(JSON.parse(lastCall()[1].body).version).toBe(3);
    });

    it("updateTaskStatus PATCHes just the status", async () => {
        fetch.mockResolvedValue(ok({ taskId: 7, status: "COMPLETED" }));
        await api.updateTaskStatus(7, "COMPLETED");
        expect(lastCall()[0]).toMatch(/\/api\/tasks\/7\/status$/);
        expect(lastCall()[1].method).toBe("PATCH");
        expect(JSON.parse(lastCall()[1].body)).toEqual({ status: "COMPLETED" });
    });

    it("deleteTask returns null on 204", async () => {
        fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error("nope"); } });
        await expect(api.deleteTask(7)).resolves.toBeNull();
        expect(lastCall()[1].method).toBe("DELETE");
    });

    it("errors carry the backend's message and status", async () => {
        fetch.mockResolvedValue(fail(409, { message: "This task was changed by someone else." }));
        const err = await api.updateTaskStatus(7, "TODO").catch((e) => e);
        expect(err).toBeInstanceOf(api.TaskApiError);
        expect(err.status).toBe(409);
        expect(err.message).toBe("This task was changed by someone else.");
    });

    it("errors fall back to a readable message when the body isn't JSON", async () => {
        fetch.mockResolvedValue(fail(403));
        const err = await api.getTask(7).catch((e) => e);
        expect(err.status).toBe(403);
        expect(err.message).toBe("Could not load this task.");
    });
});
