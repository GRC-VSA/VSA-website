import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTokenforAuthHeader } from "../authHeaders";

describe("getTokenforAuthHeader Utility", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("should return an empty object if no token is present in localStorage", () => {
        const headers = getTokenforAuthHeader();
        expect(headers).toEqual({});
    });

    it("should return Authorization header with Bearer token if token exists", () => {
        localStorage.setItem("token", "fake-jwt-token-123");

        const headers = getTokenforAuthHeader();
        expect(headers).toEqual({
            Authorization: "Bearer fake-jwt-token-123",
        });
    });
});