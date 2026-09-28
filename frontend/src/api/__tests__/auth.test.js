import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    loginUser,
    registerUser,
    verifyEmailCode,
    sendForgotPasswordEmail,
    resetPassword,
} from "../auth";

describe("Auth API Services", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("loginUser", () => {
        it("should successfully log in a user and return data", async () => {
            const mockResponse = { token: "valid-jwt-token" };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await loginUser({ email: "test@vsa.com", password: "password123" });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/users/login"),
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "test@vsa.com", password: "password123" }),
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw an error with backend error message when login fails", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                text: async () => "Invalid credentials",
            });

            await expect(
                loginUser({ email: "wrong@vsa.com", password: "badpassword" })
            ).rejects.toThrow("Incorrect email or password.");
        });
    });

    describe("verifyEmailCode", () => {
        it("should return the JSON response upon successful email verification", async () => {
            const mockResponse = { token: "a-valid-jwt" };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await verifyEmailCode({ verificationId: "vid-123", code: "ABCDEFGH" });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/users/verify"),
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ verificationId: "vid-123", code: "ABCDEFGH" }),
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw an error with backend error message when verification fails", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                text: async () => "Invalid code.",
            });

            await expect(
                verifyEmailCode({ verificationId: "vid-123", code: "WRONGCODE" })
            ).rejects.toThrow("Could not verify the code.");
        });
    });
});