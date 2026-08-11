import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import SignInPage from "../SignInPage";
import * as AuthContextModule from "../../context/AuthContext.jsx";

vi.mock("../../context/AuthContext.jsx");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../../components/AuthToggle.jsx", () => ({
    default: () => <div data-testid="auth-toggle">AuthToggle</div>,
}));
vi.mock("../../components/AuthPhotoPanel.jsx", () => ({
    default: () => <div data-testid="auth-photo-panel">AuthPhotoPanel</div>,
}));

describe("SignInPage", () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            login: mockLogin,
        });
    });

    it("renders email and password inputs", () => {
        render(
            <MemoryRouter>
                <SignInPage />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("handles successful login and redirects officer user to /officer", async () => {
        mockLogin.mockResolvedValueOnce({ role: "officer" });

        render(
            <MemoryRouter>
                <SignInPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: "officer@vsa.com" },
        });
        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: "password123" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: "officer@vsa.com",
                password: "password123",
            });
            expect(mockNavigate).toHaveBeenCalledWith("/officer");
        });
    });

    it("displays error message when login fails", async () => {
        mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

        render(
            <MemoryRouter>
                <SignInPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: "wrong@vsa.com" },
        });
        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: "badpass" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
        });
    });
});