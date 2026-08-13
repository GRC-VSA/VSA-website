import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import ResetPasswordPage from "../ResetPasswordPage";
import * as authApi from "../../api/auth";

vi.mock("../../api/auth");

const renderWithURL = (initialEntry) => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
        </MemoryRouter>
    );
};

describe("ResetPasswordPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows error message if token is missing in URL search parameters", async () => {
        renderWithURL("/reset-password");

        const passwordInput = screen.getByPlaceholderText("Enter your new password");
        fireEvent.change(passwordInput, { target: { value: "newSecret123" } });

        fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

        expect(await screen.findByText("Reset token is missing.")).toBeInTheDocument();
        expect(authApi.resetPassword).not.toHaveBeenCalled();
    });

    it("toggles password input visibility when clicking Show/Hide button", () => {
        renderWithURL("/reset-password?token=valid-token");

        const passwordInput = screen.getByPlaceholderText("Enter your new password");
        const toggleBtn = screen.getByRole("button", { name: "Show" });

        expect(passwordInput).toHaveAttribute("type", "password");

        fireEvent.click(toggleBtn);
        expect(passwordInput).toHaveAttribute("type", "text");
        expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
    });

    it("submits new password successfully when valid token is present", async () => {
        authApi.resetPassword.mockResolvedValueOnce("Password reset success");

        renderWithURL("/reset-password?token=valid-reset-token-123");

        const passwordInput = screen.getByPlaceholderText("Enter your new password");
        fireEvent.change(passwordInput, { target: { value: "brandNewPass123" } });

        fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

        await waitFor(() => {
            expect(authApi.resetPassword).toHaveBeenCalledWith({
                token: "valid-reset-token-123",
                newPassword: "brandNewPass123",
            });
            expect(
                screen.getByText("Password reset successfully. You can now sign in.")
            ).toBeInTheDocument();
            expect(passwordInput.value).toBe("");
        });
    });

    it("displays error message if password reset API call fails", async () => {
        authApi.resetPassword.mockRejectedValueOnce(new Error("Token has expired."));

        renderWithURL("/reset-password?token=expired-token");

        const passwordInput = screen.getByPlaceholderText("Enter your new password");
        fireEvent.change(passwordInput, { target: { value: "brandNewPass123" } });

        fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

        await waitFor(() => {
            expect(screen.getByText("Token has expired.")).toBeInTheDocument();
        });
    });
});