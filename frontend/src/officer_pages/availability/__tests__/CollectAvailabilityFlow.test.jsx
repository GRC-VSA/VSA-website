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

async function pickDays(from, to) {
    fireEvent.click(dayButton(from));
    fireEvent.click(dayButton(to));
}
const next = () => fireEvent.click(screen.getByText("Continue →"));
const collect = () => fireEvent.click(screen.getByText("Collect →"));

describe("CollectAvailabilityFlow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        eventsApi.getEvents.mockResolvedValue([]);
        api.createSheet.mockResolvedValue({ sheet: { sheetId: 42 } });
        api.createInvite.mockResolvedValue({});
    });

    describe("step 1", () => {
        it("requires at least one day", async () => {
            renderFlow();
            expect(screen.getByText("No days selected yet.")).toBeInTheDocument();
            next();
            expect(screen.getByRole("alert")).toHaveTextContent("Pick at least one day.");
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
            const start = label();
            fireEvent.click(screen.getByLabelText("Next month"));
            expect(label()).not.toBe(start);
            fireEvent.click(screen.getByLabelText("Previous month"));
            fireEvent.click(screen.getByLabelText("Previous month"));
            expect(label()).not.toBe(start);
        });

        it("Return goes back to the list", () => {
            renderFlow();
            fireEvent.click(screen.getByText("Return ↩"));
            expect(navigate).toHaveBeenCalledWith("/officer/availability");
        });

        it("whole-quarter mode selects a full Sunday-Saturday week from any click", () => {
            renderFlow();
            fireEvent.click(screen.getByText("Whole quarter"));
            expect(screen.getByText("Pick a sample week")).toBeInTheDocument();
            fireEvent.click(dayButton(10));
            expect(screen.getByText(/\(7 days\)/)).toBeInTheDocument();
        });

        it("switching type clears the selection", () => {
            renderFlow();
            fireEvent.click(dayButton(3));
            fireEvent.click(screen.getByText("Event"));
            expect(screen.getByText("No days selected yet.")).toBeInTheDocument();
        });

        describe("event mode", () => {
            const events = [
                { eventId: 2, title: "Later", eventDate: "2099-03-01" },
                { eventId: 1, eventName: "Sooner", eventDate: "2099-02-01" },
                { eventId: 3, title: "Past", eventDate: "2001-01-01" },
                { eventId: 4, title: "Undated" },
            ];

            it("lists upcoming events soonest first and requires a choice", async () => {
                eventsApi.getEvents.mockResolvedValue(events);
                renderFlow();
                fireEvent.click(screen.getByText("Event"));
                await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(3));
                expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
                    "Choose an upcoming event", "Sooner (Feb 1)", "Later (Mar 1)",
                ]);

                next();
                expect(screen.getByRole("alert")).toHaveTextContent("Pick the event first.");
            });

            it("choosing an event fills its date and prefills the title on step 2", async () => {
                eventsApi.getEvents.mockResolvedValue(events);
                renderFlow();
                fireEvent.click(screen.getByText("Event"));
                await screen.findByText("Sooner (Feb 1)");
                fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "1" } });
                expect(screen.getByText("Selected: Feb 1")).toBeInTheDocument();
                next();
                expect(screen.getByLabelText("Event name")).toHaveValue("Sooner");
            });

            it("shows a hint when there are no events or loading fails", async () => {
                eventsApi.getEvents.mockRejectedValue(new Error("down"));
                renderFlow();
                fireEvent.click(screen.getByText("Event"));
                expect(await screen.findByText("No upcoming events found.")).toBeInTheDocument();
                fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "" } });
            });
        });
    });

    describe("step 2", () => {
        async function toStep2(type) {
            renderFlow();
            if (type === "GENERAL") {
                fireEvent.click(screen.getByText("Whole quarter"));
                fireEvent.click(dayButton(10));
            } else {
                await pickDays(3, 4);
            }
            next();
        }

        it("Return goes back to step 1", async () => {
            await toStep2("MEETING");
            expect(screen.getByLabelText("Meeting name")).toBeInTheDocument();
            fireEvent.click(screen.getByText("Return ↩"));
            expect(screen.getByText("What are you collecting availability for?")).toBeInTheDocument();
            expect(navigate).not.toHaveBeenCalled();
        });

        it("validates the name, outside-collaborators answer and deadline", async () => {
            await toStep2("MEETING");
            collect();
            expect(screen.getByRole("alert")).toHaveTextContent("Give the sheet a name.");

            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            collect();
            expect(screen.getByRole("alert")).toHaveTextContent("Say whether people outside VSA are joining.");

            fireEvent.click(screen.getByLabelText("No"));
            fireEvent.change(screen.getByLabelText(/Stop collecting answers on/), { target: { value: "2000-01-01T10:00" } });
            collect();
            expect(screen.getByRole("alert")).toHaveTextContent("deadline has to be in the future");
            expect(api.createSheet).not.toHaveBeenCalled();
        });

        it("keeps the end time valid when the start time moves", async () => {
            await toStep2("MEETING");
            const from = screen.getByLabelText("From");
            const to = screen.getByLabelText("To");

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
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "  Sync  " } });
            fireEvent.change(screen.getByLabelText("What's it about?"), { target: { value: "Weekly sync" } });
            fireEvent.change(screen.getByLabelText(/Location/), { target: { value: " SH 152 " } });
            fireEvent.click(screen.getByLabelText("No"));
            collect();

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
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            fireEvent.click(screen.getByLabelText("No"));
            fireEvent.change(screen.getByLabelText(/Stop collecting answers on/), { target: { value: "2099-05-06T14:30" } });
            collect();
            await waitFor(() => expect(api.createSheet).toHaveBeenCalled());
            const body = api.createSheet.mock.calls[0][0];
            expect(body.description).toBeNull();
            expect(body.location).toBeNull();
            expect(body.closesAt).toBe(new Date("2099-05-06T14:30").toISOString());
        });

        it("also creates an invite link when outside collaborators are joining", async () => {
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            fireEvent.click(screen.getByLabelText("Yes"));
            fireEvent.change(screen.getByLabelText("Who are they?"), { target: { value: " ISA " } });
            collect();
            await waitFor(() => expect(navigate).toHaveBeenCalled());
            expect(api.createInvite).toHaveBeenCalledWith(42, { label: "ISA" });
        });

        it("uses no label when none is typed", async () => {
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            fireEvent.click(screen.getByLabelText("Yes"));
            collect();
            await waitFor(() => expect(api.createInvite).toHaveBeenCalledWith(42, { label: undefined }));
        });

        it("still opens the sheet when only the invite link fails, and passes the reason along", async () => {
            api.createInvite.mockRejectedValue(new Error("link limit"));
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            fireEvent.click(screen.getByLabelText("Yes"));
            collect();
            await waitFor(() => expect(navigate).toHaveBeenCalled());
            const [path, opts] = navigate.mock.calls[0];
            expect(path).toBe("/officer/availability/42");
            expect(opts.state.createError).toContain("link limit");
        });

        it("shows the server error and stays put when the sheet can't be created", async () => {
            api.createSheet.mockRejectedValue(new Error("Slots must be 30 or 60 minutes long"));
            await toStep2("MEETING");
            fireEvent.change(screen.getByLabelText("Meeting name"), { target: { value: "Sync" } });
            fireEvent.click(screen.getByLabelText("No"));
            collect();
            expect(await screen.findByRole("alert")).toHaveTextContent("Slots must be 30");
            expect(navigate).not.toHaveBeenCalled();
            expect(screen.getByText("Collect →")).not.toBeDisabled();
        });

        it("event sheets send the event id", async () => {
            eventsApi.getEvents.mockResolvedValue([{ eventId: 8, title: "Gala", eventDate: "2099-02-01" }]);
            renderFlow();
            fireEvent.click(screen.getByText("Event"));
            await screen.findByText("Gala (Feb 1)");
            fireEvent.change(screen.getByLabelText("Which event?"), { target: { value: "8" } });
            next();
            fireEvent.click(screen.getByLabelText("No"));
            collect();
            await waitFor(() => expect(api.createSheet).toHaveBeenCalled());
            expect(api.createSheet.mock.calls[0][0]).toMatchObject({ sheetType: "EVENT", eventId: 8, title: "Gala", dateStart: "2099-02-01", dateEnd: "2099-02-01" });
        });

        it("whole-quarter sheets default the quarter and send it", async () => {
            await toStep2("GENERAL");
            const start = screen.getByLabelText("Quarter starts");
            const end = screen.getByLabelText("Quarter ends");
            expect(start.value).not.toBe("");
            expect(end.value).not.toBe("");
            expect(screen.getByLabelText("Sheet name")).toBeInTheDocument();

            fireEvent.change(screen.getByLabelText("Sheet name"), { target: { value: "Fall week" } });
            fireEvent.click(screen.getByLabelText("No"));
            collect();
            await waitFor(() => expect(api.createSheet).toHaveBeenCalled());
            const body = api.createSheet.mock.calls[0][0];
            expect(body.sheetType).toBe("GENERAL");
            expect(body.quarterStart).toBe(start.value);
            expect(body.quarterEnd).toBe(end.value);
            expect(body.eventId).toBeNull();
        });

        it("whole-quarter sheets need both quarter dates", async () => {
            await toStep2("GENERAL");
            fireEvent.change(screen.getByLabelText("Sheet name"), { target: { value: "Fall week" } });
            fireEvent.click(screen.getByLabelText("No"));
            fireEvent.change(screen.getByLabelText("Quarter ends"), { target: { value: "" } });
            collect();
            expect(screen.getByRole("alert")).toHaveTextContent("when the quarter starts and ends");
            expect(api.createSheet).not.toHaveBeenCalled();
        });
    });
});
