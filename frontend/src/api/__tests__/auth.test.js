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
            ).rejects.toThrow("Invalid credentials");
        });
    });

    describe("verifyEmailCode", () => {

        it("should return verification result upon successful email verification", async () => {

            const responseData = {
                token: "sample-jwt-token",
                message: "Email verified successfully"
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => responseData
            });


            const result =
                await verifyEmailCode({
                    verificationId: "verification-123",
                    code: "123456"
                });


            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining(
                    "/api/users/verify"
                ),
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        verificationId:
                            "verification-123",

                        code:
                            "123456"
                    })
                }
            );


            expect(result)
                .toEqual(responseData);
        });
    });
});