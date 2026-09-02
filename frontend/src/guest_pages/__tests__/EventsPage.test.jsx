import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import EventsPage from "../EventsPage";
import * as EventsContextModule from "../../context/EventsContext.jsx";

vi.mock("../../context/EventsContext.jsx");

// Mock GSAP and ScrollTrigger to prevent window.matchMedia initialization errors
vi.mock("gsap", () => ({
    default: {
        registerPlugin: vi.fn(),
    },
}));

vi.mock("gsap/ScrollTrigger", () => ({
    default: {},
    ScrollTrigger: {},
}));

// The scroll-reveal hook only drives animation; stub it so elements render visible
vi.mock("../../hooks/useScrollReveal.js", () => ({
    useScrollReveal: () => ({ current: null }),
}));

describe("EventsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays loading state while events are fetching", () => {
        vi.spyOn(EventsContextModule, "useEvents").mockReturnValue({
            events: [],
            isLoading: true,
            error: null,
        });

        render(<EventsPage />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders filtered upcoming events from context", () => {
        const mockEvents = [
            {
                eventId: 1,
                eventName: "Badminton Tournament 2026",
                title: "sport",
                status: "upcoming",
                eventDate: "2026-10-15",
                startTime: "10:00:00",
                endTime: "16:00:00",
                location: "Student Gym",
                description: "Fun sports event!",
                imageUrl: "/images/badminton.jpg",
            },
        ];

        vi.spyOn(EventsContextModule, "useEvents").mockReturnValue({
            events: mockEvents,
            isLoading: false,
            error: null,
        });

        render(<EventsPage />);

        // Query heading specifically to avoid duplicate text matches in static page text
        expect(
            screen.getByRole("heading", { name: "Badminton Tournament 2026" })
        ).toBeInTheDocument();
    });

    it("displays 'Oops! No Event Found.' when filtering matches no events", () => {
        const mockEvents = [
            {
                eventId: 1,
                eventName: "Badminton Tournament 2026",
                title: "sport",
                status: "upcoming",
                eventDate: "2026-10-15",
                startTime: "10:00:00",
                endTime: "16:00:00",
                location: "Student Gym",
                description: "Fun sports event!",
                imageUrl: "/images/badminton.jpg",
            },
        ];

        vi.spyOn(EventsContextModule, "useEvents").mockReturnValue({
            events: mockEvents,
            isLoading: false,
            error: null,
        });

        const { container } = render(<EventsPage />);

        // Select input by name attribute
        const searchInput = container.querySelector('input[name="eventNameSearch"]');
        fireEvent.change(searchInput, { target: { value: "NonExistentEvent" } });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(screen.getByText("Oops! No Event Found.")).toBeInTheDocument();
    });
});