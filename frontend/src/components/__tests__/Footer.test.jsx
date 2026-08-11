import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Footer from "../Footer";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../hooks/useScrollReveal.js", () => ({
    useScrollReveal: () => ({ current: null }),
}));

describe("Footer Component", () => {
    it("renders branding and contact details correctly", () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        expect(screen.getByText("VIETNAMESE")).toBeInTheDocument();
        expect(screen.getByText("Mia Luu")).toBeInTheDocument();
        expect(screen.getByText("Luu.My@student.greenriver.edu")).toBeInTheDocument();
    });

    it("navigates to /events when clicking 'Browse Events'", () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const browseBtn = screen.getByRole("button", { name: /Browse Events/i });
        fireEvent.click(browseBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/events");
    });

    it("navigates to /apply when clicking 'Apply Officer'", () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const applyBtn = screen.getByRole("button", { name: /Apply Officer/i });
        fireEvent.click(applyBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/apply");
    });
});