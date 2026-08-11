import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEvents, createEvent } from "../events";

describe("Events API Services", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getEvents should fetch and return all events", async () => {
        const mockEvents = [{ id: 1, title: "VSA Banquet" }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockEvents,
        });

        const data = await getEvents();

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/events"));
        expect(data).toEqual(mockEvents);
    });

    it("createEvent should construct FormData and include Authorization headers", async () => {
        localStorage.setItem("token", "my-admin-token");
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 10, title: "New Event" }),
        });

        const eventData = { title: "New Event", location: "Student Center" };
        const mockFile = new File(["dummy"], "event.jpg", { type: "image/jpeg" });

        await createEvent(eventData, [mockFile]);

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/events"),
            expect.objectContaining({
                method: "POST",
                headers: {
                    Authorization: "Bearer my-admin-token",
                },
                body: expect.any(FormData),
            })
        );
    });
});