import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import VerifyEmailPage from "../VerifyEmailPage";
import * as authApi from "../../api/auth";

vi.mock("../../api/auth");

const renderWithURL = (initialEntry) => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
        </MemoryRouter>
    );
};

describe("VerifyEmailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays missing token message if no token parameter is supplied in URL", async () => {
        renderWithURL("/verify-email");

        expect(await screen.findByText("Verification token is missing.")).toBeInTheDocument();
        expect(authApi.verifyEmailToken).not.toHaveBeenCalled();
    });

    it("automatically verifies token on mount and displays success message", async () => {
        authApi.verifyEmailToken.mockResolvedValueOnce("Verified successfully");

        renderWithURL("/verify-email?token=valid-email-token-123");

        await waitFor(() => {
            expect(authApi.verifyEmailToken).toHaveBeenCalledWith("valid-email-token-123");
            expect(
                screen.getByText("Your email has been verified. You can now sign in.")
            ).toBeInTheDocument();
        });
    });

    it("displays error message when token verification fails", async () => {
        authApi.verifyEmailToken.mockRejectedValueOnce(
            new Error("Email verification failed @.@ Bro be a nobody")
        );

        renderWithURL("/verify-email?token=invalid-token");

        await waitFor(() => {
            expect(
                screen.getByText("Email verification failed @.@ Bro be a nobody")
            ).toBeInTheDocument();
        });
    });
});