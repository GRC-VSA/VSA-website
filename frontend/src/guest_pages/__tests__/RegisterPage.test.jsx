import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import RegisterPage from "../RegisterPage";
import * as authApi from "../../api/auth.js";

vi.mock("../../api/auth.js");
vi.mock("../../components/AuthToggle.jsx", () => ({
    default: () => <div>AuthToggle</div>,
}));
vi.mock("../../components/AuthPhotoPanel.jsx", () => ({
    default: () => <div>AuthPhotoPanel</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("RegisterPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows error when passwords do not match", async () => {
        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "John" } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Doe" } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "john@vsa.com" } });
        fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "password123" } });
        fireEvent.change(screen.getByLabelText(/Re-enter Password/i), { target: { value: "password999" } });

        fireEvent.click(screen.getByRole("button", { name: "Create account" }));

        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
        expect(authApi.registerUser).not.toHaveBeenCalled();
    });

    it("submits registration successfully when passwords match", async () => {
        authApi.registerUser.mockResolvedValueOnce({
            verificationId: "vid-123",
            maskedEmail: "j***e@vsa.com",
            expiresAt: "2026-09-17T12:00:00Z",
        });

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Jane" } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Luu" } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "jane@vsa.com" } });
        fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "password123" } });
        fireEvent.change(screen.getByLabelText(/Re-enter Password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
            expect(authApi.registerUser).toHaveBeenCalledWith({
                firstName: "Jane",
                lastName: "Luu",
                email: "jane@vsa.com",
                phone: "",
                passwordHash: "password123",
            });
            expect(mockNavigate).toHaveBeenCalledWith("/verify", {
                replace: true,
                state: {
                    verificationId: "vid-123",
                    maskedEmail: "j***e@vsa.com",
                    expiresAt: "2026-09-17T12:00:00Z",
                    email: "jane@vsa.com",
                },
            });
        });
    });
});