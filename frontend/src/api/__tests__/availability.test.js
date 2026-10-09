import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as api from "../Availability.js";

const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status, body) => ({
    ok: false,
    status,
    json: body === undefined ? async () => { throw new Error("no body"); } : async () => body,
});

describe("Availability API", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        localStorage.clear();
        localStorage.setItem("token", "jwt-1");
    });
    afterEach(() => vi.restoreAllMocks());

    const lastCall = () => fetch.mock.calls[0];

    it("officer calls send the bearer token and hit the right URL/method", async () => {
        fetch.mockResolvedValue(ok([]));
        await api.listSheets();
        expect(lastCall()[0]).toContain("/api/availability/sheets");
        expect(lastCall()[1].method).toBe("GET");
        expect(lastCall()[1].headers.Authorization).toBe("Bearer jwt-1");
        expect(lastCall()[1].body).toBeUndefined();
        expect(lastCall()[1].headers["Content-Type"]).toBeUndefined();
    });

    it.each([
        ["getSheet", () => api.getSheet(4), "GET", "/sheets/4"],
        ["closeSheet", () => api.closeSheet(4), "POST", "/sheets/4/close"],
        ["reopenSheet", () => api.reopenSheet(4), "POST", "/sheets/4/reopen"],
        ["listInvites", () => api.listInvites(4), "GET", "/sheets/4/invites"],
        ["revokeInvite", () => api.revokeInvite(9), "POST", "/invites/9/revoke"],
    ])("%s", async (_name, call, method, path) => {
        fetch.mockResolvedValue(ok({ a: 1 }));
        await expect(call()).resolves.toEqual({ a: 1 });
        expect(lastCall()[0]).toContain(`/api/availability${path}`);
        expect(lastCall()[1].method).toBe(method);
    });

    it.each([
        ["deleteSheet", () => api.deleteSheet(4), "/sheets/4"],
        ["deleteMyEntry", () => api.deleteMyEntry(4), "/sheets/4/my-entry"],
        ["removeEntry", () => api.removeEntry(7), "/entries/7"],
    ])("%s returns null on 204", async (_name, call, path) => {
        fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error("nope"); } });
        await expect(call()).resolves.toBeNull();
        expect(lastCall()[0]).toContain(path);
        expect(lastCall()[1].method).toBe("DELETE");
    });

    it("createSheet posts JSON", async () => {
        fetch.mockResolvedValue(ok({ sheet: {} }, 201));
        await api.createSheet({ title: "T" });
        expect(lastCall()[1].method).toBe("POST");
        expect(lastCall()[1].headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(lastCall()[1].body)).toEqual({ title: "T" });
    });

    it("saveMyEntry puts slots and note", async () => {
        fetch.mockResolvedValue(ok({}));
        await api.saveMyEntry(3, ["a", "b"], "hi");
        expect(lastCall()[0]).toContain("/sheets/3/my-entry");
        expect(lastCall()[1].method).toBe("PUT");
        expect(JSON.parse(lastCall()[1].body)).toEqual({ slots: ["a", "b"], note: "hi" });
    });

    it("createInvite posts label/expiresAt/maxUses and tolerates no options", async () => {
        fetch.mockResolvedValue(ok({}, 201));
        await api.createInvite(3, { label: "ISA", maxUses: 5 });
        expect(JSON.parse(lastCall()[1].body)).toEqual({ label: "ISA", maxUses: 5 });

        fetch.mockClear();
        fetch.mockResolvedValue(ok({}, 201));
        await api.createInvite(3);
        expect(lastCall()[0]).toContain("/sheets/3/invites");
    });

    it("inviteUrl builds the guest page URL", () => {
        expect(api.inviteUrl("tok")).toBe(`${window.location.origin}/availability/invite/tok`);
    });

    describe("guest calls", () => {
        it("getGuestSheet sends no JWT and passes the edit token header when given", async () => {
            fetch.mockResolvedValue(ok({}));
            await api.getGuestSheet("t/k", "edit-1");
            expect(lastCall()[0]).toContain("/api/availability/invite/t%2Fk");
            expect(lastCall()[1].headers["X-Edit-Token"]).toBe("edit-1");
            expect(lastCall()[1].headers.Authorization).toBeUndefined();

            fetch.mockClear();
            fetch.mockResolvedValue(ok({}));
            await api.getGuestSheet("tok");
            expect(lastCall()[1].headers["X-Edit-Token"]).toBeUndefined();
        });

        it("submitGuestEntry posts to /entry", async () => {
            fetch.mockResolvedValue(ok({ editToken: "e" }, 201));
            await api.submitGuestEntry("tok", { name: "Bob", email: "b@x.com", slots: ["a"], note: null, extra: 1 });
            expect(lastCall()[0]).toContain("/invite/tok/entry");
            expect(lastCall()[1].method).toBe("POST");
            expect(JSON.parse(lastCall()[1].body)).toEqual({ name: "Bob", email: "b@x.com", slots: ["a"], note: null });
        });

        it("updateGuestEntry puts with the edit token header", async () => {
            fetch.mockResolvedValue(ok({}));
            await api.updateGuestEntry("tok", "edit-1", { name: "Bob", slots: [], note: "n" });
            expect(lastCall()[1].method).toBe("PUT");
            expect(lastCall()[1].headers["X-Edit-Token"]).toBe("edit-1");
            expect(JSON.parse(lastCall()[1].body)).toEqual({ name: "Bob", slots: [], note: "n" });
        });

        it("withdrawGuestEntry deletes with the edit token header", async () => {
            fetch.mockResolvedValue({ ok: true, status: 204 });
            await expect(api.withdrawGuestEntry("tok", "edit-1")).resolves.toBeNull();
            expect(lastCall()[1].method).toBe("DELETE");
            expect(lastCall()[1].headers["X-Edit-Token"]).toBe("edit-1");
        });

        it("recoverGuestLink posts the email", async () => {
            fetch.mockResolvedValue(ok({ message: "sent" }, 202));
            await expect(api.recoverGuestLink("tok", "b@x.com")).resolves.toEqual({ message: "sent" });
            expect(lastCall()[0]).toContain("/invite/tok/recover");
            expect(JSON.parse(lastCall()[1].body)).toEqual({ email: "b@x.com" });
        });
    });

    describe("errors", () => {
        it("uses the backend message and exposes the HTTP status", async () => {
            fetch.mockResolvedValue(fail(409, { message: "Sheet is closed" }));
            const err = await api.getSheet(1).catch((e) => e);
            expect(err).toBeInstanceOf(api.AvailabilityApiError);
            expect(err.name).toBe("AvailabilityApiError");
            expect(err.status).toBe(409);
            expect(err.message).toBe("Sheet is closed");
        });

        it("falls back to the default message when the body is not JSON", async () => {
            fetch.mockResolvedValue(fail(500));
            const err = await api.listSheets().catch((e) => e);
            expect(err.message).toBe("Could not load availability sheets.");
            expect(err.status).toBe(500);
        });

        it("falls back when the JSON has no message", async () => {
            fetch.mockResolvedValue(fail(400, {}));
            const err = await api.closeSheet(1).catch((e) => e);
            expect(err.message).toBe("Could not close the sheet.");
        });
    });
});
