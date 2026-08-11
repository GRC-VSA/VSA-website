import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import ForgotPasswordPage from "../ForgotPasswordPage";
import * as authApi from "../../api/auth.js";

vi.mock("../../api/auth.js");

describe("ForgotPasswordPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders email input and submit button", () => {
        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );

        expect(screen.getByRole("heading", { name: "Forgot password" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
    });

    it("submits email successfully and displays success message", async () => {
        authApi.sendForgotPasswordEmail.mockResolvedValueOnce("Email sent");

        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/Email/i);
        fireEvent.change(emailInput, { target: { value: "test@vsa.com" } });

        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

        await waitFor(() => {
            expect(authApi.sendForgotPasswordEmail).toHaveBeenCalledWith("test@vsa.com");
            expect(
                screen.getByText("Password reset email sent. Please check your inbox.")
            ).toBeInTheDocument();
            expect(emailInput.value).toBe("");
        });
    });

    it("displays error message when sending reset email fails", async () => {
        authApi.sendForgotPasswordEmail.mockRejectedValueOnce(
            new Error("User with this email does not exist")
        );

        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: "unknown@vsa.com" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

        await waitFor(() => {
            expect(
                screen.getByText("User with this email does not exist")
            ).toBeInTheDocument();
        });
    });
});