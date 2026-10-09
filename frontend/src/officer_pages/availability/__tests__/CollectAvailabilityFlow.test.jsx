import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CollectAvailabilityFlow from "../CollectAvailabilityFlow.jsx";
import * as api from "../../../api/Availability.js";
import * as eventsApi from "../../../api/Events.js";
import { monthLong } from "../availabilityFormat.js";

vi.mock("../../../api/Availability.js");
vi.mock("../../../api/Events.js");

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

// The calendar opens on the current month, so days 1-20 of it are always on screen.
const now = new Date();
const dayButton = (d) => screen.getByLabelText(`${monthLong(now.getMonth())} ${d}, ${now.getFullYear()}`);
const iso = (d) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const renderFlow = () => render(<MemoryRouter><CollectAvailabilityFlow /></MemoryRouter>);

function pickDays(from, to) {
    fireEvent.click(dayButton(from));
    fireEvent.click(dayButton(to));
}
const start = () => fireEvent.click(screen.getByText("Start collecting"));
const nameField = () => screen.getByLabelText("Name");

describe("CollectAvailabilityFlow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        eventsApi.getEvents.mockResolvedValue([]);
        api.createSheet.mockResolvedValue({ sheet: { sheetId: 42 } });
        api.createInvite.mockResolvedValue({});
    });

    describe("choosing days", () => {
        it("requires at least one day", () => {
            renderFlow();
            expect(screen.getByText("No days selected yet.")).toBeInTheDocument();
            start();
            expect(screen.getByRole("alert")).toHaveTextContent("Pick at least one day on the calendar.");
            expect(api.createSheet).not.toHaveBeenCalled();
        });

        it("selects a range (either click order) and reports the length", () => {
            renderFlow();
            pickDays(5, 8);
            expect(screen.getByText(/Selected: .* to .* \(4 days\)/)).toBeInTheDocument();

            pickDays(12, 10);
            expect(screen.getByText(/\(3 days\)/)).toBeInTheDocument();
            expect(dayButton(11)).toHaveAttribute("aria-pressed", "true");
        });

        it("a single click selects one day", () => {
            renderFlow();
            fireEvent.click(dayButton(3));
            expect(screen.getByText(/^Selected: \w+ 3$/)).toBeInTheDocument();
        });

        it("rejects ranges over 14 days and starts a new range", () => {
            renderFlow();
            pickDays(1, 20);
            expect(screen.getByRole("alert")).toHaveTextContent("at most 14 days");
            expect(screen.getByText(/^Selected: \w+ 20$/)).toBeInTheDocument();
        });

        it("browses months", () => {
            renderFlow();
            const label = () => document.querySelector(".av-cal-month").textContent;
            const first = label();
            fireEvent.click(screen.getByLabelText("Next month"));
            expect(label()).not.toBe(first);
            fireEvent.click(screen.getByLabelText("Previous month"));
            expect(label()).toBe(first);
            fireEvent.click(screen.getByLabelText("Previous month"));
            expect(label()).not.toBe(first);
        });

        it("the back link and Cancel both return to the list", () => {
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /Back to availability/ }));
            expect(navigate).toHaveBeenLastCalledWith("/officer/availability");
            navigate.mockClear();
            fireEvent.click(screen.getByText("Cancel"));
            expect(navigate).toHaveBeenCalledWith("/officer/availability");
        });
    });

    describe("event mode", () => {
        const events = [
            { eventId: 2, title: "Later", eventDate: "2099-03-01" },
            { eventId: 1, eventName: "Sooner", eventDate: "2099-02-01" },
            { eventId: 3, title: "Past", eventDate: "2001-01-01" },
            { eventId: 4, title: "Undated" },
        ];

        it("General meeting is the default and offers no event picker", () => {
            renderFlow();
            expect(screen.getByRole("button", { name: /General meeting/ })).toHaveAttribute("aria-pressed", "true");
            expect(screen.queryByLabelText("Which event?")).not.toBeInTheDocument();
        });

        it("lists upcoming events soonest first and requires a choice", async () => {
            eventsApi.getEvents.mockResolvedValue(events);
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            const picker = screen.getByLabelText("Which event?");
            await waitFor(() => expect(within(picker).getAllByRole("option")).toHaveLength(3));
            expect(within(picker).getAllByRole("option").map((o) => o.textContent)).toEqual([
                "Choose an upcoming event", "Sooner · Feb 1", "Later · Mar 1",
            ]);

            start();
            expect(screen.getByRole("alert")).toHaveTextContent("Pick the event this is for.");
            expect(api.createSheet).not.toHaveBeenCalled();
        });

        it("choosing an event fills its date and prefills the name", async () => {
            eventsApi.getEvents.mockResolvedValue(events);
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            await screen.findByText("Sooner · Feb 1");
            fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "1" } });
            expect(screen.getByText("Selected: Feb 1")).toBeInTheDocument();
            expect(nameField()).toHaveValue("Sooner availability");
        });

        it("keeps a name the user already typed when an event is chosen", async () => {
            eventsApi.getEvents.mockResolvedValue(events);
            renderFlow();
            fireEvent.change(nameField(), { target: { value: "My own name" } });
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            await screen.findByText("Sooner · Feb 1");
            fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "1" } });
            expect(nameField()).toHaveValue("My own name");
        });

        it("switching back to a general meeting drops the chosen event", async () => {
            eventsApi.getEvents.mockResolvedValue(events);
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            await screen.findByText("Sooner · Feb 1");
            fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "1" } });

            fireEvent.click(screen.getByRole("button", { name: /General meeting/ }));
            expect(screen.queryByLabelText("Which event?")).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            expect(screen.getByLabelText("Which event?")).toHaveValue("");
        });

        it("shows a hint when there are no events or loading fails", async () => {
            eventsApi.getEvents.mockRejectedValue(new Error("down"));
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            expect(await screen.findByText(/No upcoming events/)).toBeInTheDocument();
        });
    });

    describe("submitting", () => {
        it("validates the name and the deadline", () => {
            renderFlow();
            pickDays(3, 4);
            start();
            expect(screen.getByRole("alert")).toHaveTextContent("Give the sheet a name.");

            fireEvent.change(nameField(), { target: { value: "Sync" } });
            fireEvent.change(screen.getByLabelText(/Stop collecting on/), { target: { value: "2000-01-01T10:00" } });
            start();
            expect(screen.getByRole("alert")).toHaveTextContent("deadline has to be in the future");
            expect(api.createSheet).not.toHaveBeenCalled();
        });

        it("keeps the end time valid when the start time moves", () => {
            renderFlow();
            const from = screen.getByLabelText("Earliest time");
            const to = screen.getByLabelText("Latest time");
            expect(screen.getByText(/14 hours a day/)).toBeInTheDocument();

            fireEvent.change(from, { target: { value: "10:00" } });
            expect(to).toHaveValue("22:00"); // still valid, kept

            fireEvent.change(from, { target: { value: "22:00" } });
            expect(to).toHaveValue("23:30"); // pushed forward, capped at 11:30 PM

            fireEvent.change(from, { target: { value: "23:00" } });
            expect(to).toHaveValue("23:30");

            fireEvent.change(from, { target: { value: "06:00" } });
            expect(to).toHaveValue("08:00"); // 22:00 would be 32 rows, so reset to start + 2h
            expect(within(to).queryByRole("option", { name: "10 PM" })).not.toBeInTheDocument();
            expect(within(to).getByRole("option", { name: "8 PM" })).toBeInTheDocument();
        });

        it("creates a meeting sheet without an outside link", async () => {
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "  Sync  " } });
            fireEvent.change(screen.getByLabelText("Description (optional)"), { target: { value: " Weekly sync " } });
            fireEvent.change(screen.getByLabelText(/Location/), { target: { value: " SH 152 " } });
            start();

            await waitFor(() => expect(navigate).toHaveBeenCalledWith("/officer/availability/42", { state: { createError: "" } }));
            expect(api.createSheet).toHaveBeenCalledWith({
                title: "Sync",
                description: "Weekly sync",
                location: "SH 152",
                sheetType: "MEETING",
                eventId: null,
                quarterStart: null,
                quarterEnd: null,
                dateStart: iso(3),
                dateEnd: iso(4),
                dayStartTime: "08:00",
                dayEndTime: "22:00",
                slotMinutes: 30,
                closesAt: null,
            });
            expect(api.createInvite).not.toHaveBeenCalled();
        });

        it("sends blank optional fields as null and a deadline as an ISO instant", async () => {
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            fireEvent.change(screen.getByLabelText(/Stop collecting on/), { target: { value: "2099-05-06T14:30" } });
            start();
            await waitFor(() => expect(api.createSheet).toHaveBeenCalled());
            const body = api.createSheet.mock.calls[0][0];
            expect(body.description).toBeNull();
            expect(body.location).toBeNull();
            expect(body.closesAt).toBe(new Date("2099-05-06T14:30").toISOString());
        });

        it("also creates an invite link when people outside VSA are included", async () => {
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            fireEvent.click(screen.getByRole("button", { name: /Also people outside VSA/ }));
            fireEvent.change(screen.getByLabelText("Who are they?"), { target: { value: " ISA " } });
            start();
            await waitFor(() => expect(navigate).toHaveBeenCalled());
            expect(api.createInvite).toHaveBeenCalledWith(42, { label: "ISA" });
        });

        it("hides the label field again for officers only", () => {
            renderFlow();
            expect(screen.queryByLabelText("Who are they?")).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: /Also people outside VSA/ }));
            expect(screen.getByLabelText("Who are they?")).toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: /Officers only/ }));
            expect(screen.queryByLabelText("Who are they?")).not.toBeInTheDocument();
        });

        it("uses no label when none is typed", async () => {
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            fireEvent.click(screen.getByRole("button", { name: /Also people outside VSA/ }));
            start();
            await waitFor(() => expect(api.createInvite).toHaveBeenCalledWith(42, { label: undefined }));
        });

        it("still opens the sheet when only the invite link fails, and passes the reason along", async () => {
            api.createInvite.mockRejectedValue(new Error("link limit"));
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            fireEvent.click(screen.getByRole("button", { name: /Also people outside VSA/ }));
            start();
            await waitFor(() => expect(navigate).toHaveBeenCalled());
            const [path, opts] = navigate.mock.calls[0];
            expect(path).toBe("/officer/availability/42");
            expect(opts.state.createError).toContain("link limit");
        });

        it("shows the server error and stays put when the sheet can't be created", async () => {
            api.createSheet.mockRejectedValue(new Error("Slots must be 30 or 60 minutes long"));
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            start();
            expect(await screen.findByRole("alert")).toHaveTextContent("Slots must be 30");
            expect(navigate).not.toHaveBeenCalled();
            expect(screen.getByText("Start collecting")).not.toBeDisabled();
        });

        it("disables the button while creating", async () => {
            let finish;
            api.createSheet.mockReturnValue(new Promise((resolve) => (finish = resolve)));
            renderFlow();
            pickDays(3, 4);
            fireEvent.change(nameField(), { target: { value: "Sync" } });
            start();
            expect(await screen.findByText("Creating…")).toBeDisabled();
            finish({ sheet: { sheetId: 42 } });
            await waitFor(() => expect(navigate).toHaveBeenCalled());
        });

        it("event sheets send the event id", async () => {
            eventsApi.getEvents.mockResolvedValue([{ eventId: 8, title: "Gala", eventDate: "2099-02-01" }]);
            renderFlow();
            fireEvent.click(screen.getByRole("button", { name: /^Event/ }));
            await screen.findByText("Gala · Feb 1");
            fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "8" } });
            start();
            await waitFor(() => expect(api.createSheet).toHaveBeenCalled());
            expect(api.createSheet.mock.calls[0][0]).toMatchObject({
                sheetType: "EVENT", eventId: 8, title: "Gala availability", dateStart: "2099-02-01", dateEnd: "2099-02-01",
            });
        });
    });
});
