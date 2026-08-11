import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Navbar from "../Navbar";
import * as AuthContextModule from "../../context/AuthContext";

vi.mock("../../context/AuthContext");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("Navbar Component", () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders Sign-in button when user is unauthenticated", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            user: null,
            logout: mockLogout,
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        // Use getAllByRole to handle both desktop and mobile links
        const signInLinks = screen.getAllByRole("link", { name: "Sign-in" });
        expect(signInLinks[0]).toBeInTheDocument();
    });

    it("renders user account dropdown and officer links when user is an officer", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            user: { email: "officer@vsa.com", role: "officer" },
            logout: mockLogout,
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const accountButton = screen.getByRole("button", { name: "" });
        fireEvent.click(accountButton);

        // Target the specific dropdown items inside the desktop menu
        expect(screen.getAllByText("Setting")[0]).toBeInTheDocument();
        expect(screen.getAllByText("To Officer Board")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Logout")[0]).toBeInTheDocument();
    });

    it("calls logout and navigates to '/' when clicking Logout button", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            user: { email: "member@vsa.com", role: "member" },
            logout: mockLogout,
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const accountButton = screen.getByRole("button", { name: "" });
        fireEvent.click(accountButton);

        const logoutBtn = screen.getAllByText("Logout")[0];
        fireEvent.click(logoutBtn);

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("toggles mobile menu when clicking hamburger icon", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            user: null,
            logout: mockLogout,
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const mobileToggle = screen.getByLabelText("Toggle menu");
        fireEvent.click(mobileToggle);

        const mobileEventsLink = screen.getAllByRole("link", { name: "Events" })[1];
        expect(mobileEventsLink).toBeInTheDocument();
    });
});