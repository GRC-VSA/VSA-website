import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import AvailabilityInvitePage from "../AvailabilityInvitePage.jsx";
import * as api from "../../api/Availability.js";
import { guestView, sheetInfo, SLOTS, visibleHeatmap } from "../../officer_pages/availability/__tests__/fixtures.js";

vi.mock("../../api/Availability.js", () => ({
    getGuestSheet: vi.fn(),
    submitGuestEntry: vi.fn(),
    updateGuestEntry: vi.fn(),
    withdrawGuestEntry: vi.fn(),
    recoverGuestLink: vi.fn(),
    inviteUrl: (token) => `https://vsa.test/availability/invite/${token}`,
}));

const KEY = "vsa-availability-edit:tok";
const entry = (over = {}) => ({ name: "Bob", email: "bob@x.com", slots: [SLOTS[0][0]], note: "hi", ...over });
const err = (message, status) => Object.assign(new Error(message), { status });

function renderPage(path = "/availability/invite/tok") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/availability/invite/:token" element={<AvailabilityInvitePage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("AvailabilityInvitePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe("loading", () => {
        it("shows loading then the sheet with organiser, label and hidden-heatmap notice", async () => {
            api.getGuestSheet.mockResolvedValue(guestView());
            renderPage();
            expect(screen.getByText("Loading…")).toBeInTheDocument();

            expect(await screen.findByText("Board meeting")).toBeInTheDocument();
            expect(api.getGuestSheet).toHaveBeenCalledWith("tok", null);
            expect(screen.getByText(/Organized by Carol Chan for ISA/)).toBeInTheDocument();
            expect(screen.getByText("SH 152")).toBeInTheDocument();
            expect(screen.getByText("Group view unlocks at 3 responses")).toBeInTheDocument();
            expect(screen.getByText("+ Add my availability")).toBeInTheDocument();
            expect(screen.getByText("Already answered but lost your edit link?")).toBeInTheDocument();
        });

        it("falls back to 'guests' when the link has no label and shows deadlines", async () => {
            api.getGuestSheet.mockResolvedValue(guestView({ inviteLabel: "", sheet: sheetInfo({ location: null, closesAt: new Date(2030, 0, 3, 17, 0).toISOString() }) }));
            renderPage();
            expect(await screen.findByText(/for guests/)).toBeInTheDocument();
            expect(screen.getByText("Jan 3, 5 PM")).toBeInTheDocument();
        });

        it("closed sheets have a pill and no add button", async () => {
            api.getGuestSheet.mockResolvedValue(guestView({ sheet: sheetInfo({ open: false, closesAt: new Date(2030, 0, 3, 9, 0).toISOString() }) }));
            renderPage();
            expect(await screen.findByText("Closed", { selector: ".av-pill" })).toBeInTheDocument();
            expect(screen.queryByText(/Add my availability/)).not.toBeInTheDocument();
            expect(screen.getByText("Status")).toBeInTheDocument();
        });

        it("shows the heatmap legend when visible", async () => {
            api.getGuestSheet.mockResolvedValue(guestView({ heatmap: visibleHeatmap }));
            renderPage();
            await screen.findByText("Board meeting");
            expect(screen.getByText("3 of 4 free")).toBeInTheDocument();
            expect(screen.queryByText(/Group view unlocks/)).not.toBeInTheDocument();
        });

        it("explains an invalid or expired link (404) and shows other errors verbatim", async () => {
            api.getGuestSheet.mockRejectedValueOnce(err("x", 404));
            const { unmount } = renderPage();
            expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
            unmount();

            api.getGuestSheet.mockRejectedValueOnce(err("Network down", 0));
            renderPage();
            expect(await screen.findByText("Network down")).toBeInTheDocument();
        });
    });

    describe("edit tokens", () => {
        it("sends a saved edit token and shows the guest's entry", async () => {
            localStorage.setItem(KEY, "saved");
            api.getGuestSheet.mockResolvedValue(guestView({ myEntry: entry() }));
            renderPage();
            expect(await screen.findByText("Edit my availability")).toBeInTheDocument();
            expect(api.getGuestSheet).toHaveBeenCalledWith("tok", "saved");
            expect(screen.queryByText("Already answered but lost your edit link?")).not.toBeInTheDocument();
        });

        it("stores a token from ?edit= and uses it", async () => {
            api.getGuestSheet.mockResolvedValue(guestView({ myEntry: entry() }));
            renderPage("/availability/invite/tok?edit=fromurl");
            await screen.findByText("Edit my availability");
            expect(localStorage.getItem(KEY)).toBe("fromurl");
            expect(api.getGuestSheet).toHaveBeenCalledWith("tok", "fromurl");
        });

        it("drops a stale token and tells the guest how to recover", async () => {
            localStorage.setItem(KEY, "stale");
            api.getGuestSheet.mockResolvedValue(guestView({ myEntry: null }));
            renderPage();
            expect(await screen.findByRole("status")).toHaveTextContent("no longer works");
            expect(localStorage.getItem(KEY)).toBeNull();
        });

        it("survives browser storage being unavailable", async () => {
            const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("blocked");
            });
            api.getGuestSheet.mockResolvedValue(guestView());
            renderPage();
            expect(await screen.findByText("Board meeting")).toBeInTheDocument();
            getItem.mockRestore();
        });
    });

    describe("first submission", () => {
        async function openForm() {
            api.getGuestSheet.mockResolvedValue(guestView());
            renderPage();
            fireEvent.click(await screen.findByText("+ Add my availability"));
        }

        it("requires a name, then an email", async () => {
            await openForm();
            expect(screen.getByLabelText("Email")).not.toBeDisabled();
            expect(screen.getByText(/only used to keep one answer per person/)).toBeInTheDocument();

            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            expect(screen.getByRole("alert")).toHaveTextContent("Enter your name.");

            fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Bob" } });
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            expect(screen.getByRole("alert")).toHaveTextContent("Enter your email.");
            expect(api.submitGuestEntry).not.toHaveBeenCalled();
        });

        it("submits, stores the edit token and shows a personal link", async () => {
            api.submitGuestEntry.mockResolvedValue({ editToken: "new-edit", view: guestView({ myEntry: entry() }) });
            await openForm();

            fireEvent.change(screen.getByLabelText("Your name"), { target: { value: " Bob " } });
            fireEvent.change(screen.getByLabelText("Email"), { target: { value: " bob@x.com " } });
            fireEvent.change(screen.getByLabelText(/Anything the organizer should know/), { target: { value: " hi " } });
            fireEvent.keyDown(screen.getByRole("grid", { name: /Your availability/ }), { key: " " });
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom

            await waitFor(() =>
                expect(api.submitGuestEntry).toHaveBeenCalledWith("tok", { name: "Bob", slots: [SLOTS[0][0]], note: "hi", email: "bob@x.com" })
            );
            expect(await screen.findByLabelText("Your personal edit link")).toHaveValue("https://vsa.test/availability/invite/tok?edit=new-edit");
            expect(localStorage.getItem(KEY)).toBe("new-edit");
            expect(screen.getByRole("status")).toHaveTextContent("Saved.");
            expect(screen.getByText("Edit my availability")).toBeInTheDocument();
        });

        it("sends a null note when it is blank", async () => {
            api.submitGuestEntry.mockResolvedValue({ editToken: "e", view: guestView({ myEntry: entry() }) });
            await openForm();
            fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Bob" } });
            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "b@x.com" } });
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            await waitFor(() => expect(api.submitGuestEntry).toHaveBeenCalled());
            expect(api.submitGuestEntry.mock.calls[0][1].note).toBeNull();
        });

        it("shows the server's reason (e.g. officer email) and re-enables saving", async () => {
            api.submitGuestEntry.mockRejectedValue(err("This email belongs to a VSA officer account.", 409));
            await openForm();
            fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Bob" } });
            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "o@x.com" } });
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            expect(await screen.findByRole("alert")).toHaveTextContent("VSA officer account");
            screen.getAllByText("Save").forEach((b) => expect(b).not.toBeDisabled());
        });

        it("Cancel returns to the heatmap view", async () => {
            await openForm();
            fireEvent.click(screen.getAllByText("Cancel")[0]);
            expect(screen.getByText("+ Add my availability")).toBeInTheDocument();
            expect(api.submitGuestEntry).not.toHaveBeenCalled();
        });

        it("does not offer 'Remove my response' before answering", async () => {
            await openForm();
            expect(screen.queryByText("Remove my response")).not.toBeInTheDocument();
        });
    });

    describe("editing an existing response", () => {
        beforeEach(() => {
            localStorage.setItem(KEY, "mine");
            api.getGuestSheet.mockResolvedValue(guestView({ myEntry: entry() }));
        });

        async function openForm() {
            renderPage();
            fireEvent.click(await screen.findByText("Edit my availability"));
        }

        it("prefills the form and locks the email", async () => {
            await openForm();
            expect(screen.getByLabelText("Your name")).toHaveValue("Bob");
            expect(screen.getByLabelText("Email")).toHaveValue("bob@x.com");
            expect(screen.getByLabelText("Email")).toBeDisabled();
            expect(screen.getByLabelText(/Anything the organizer should know/)).toHaveValue("hi");
            expect(screen.queryByText(/only used to keep one answer/)).not.toBeInTheDocument();
        });

        it("saves changes with the edit token", async () => {
            api.updateGuestEntry.mockResolvedValue(guestView({ myEntry: entry({ name: "Robert" }) }));
            await openForm();
            fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robert" } });
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            await waitFor(() =>
                expect(api.updateGuestEntry).toHaveBeenCalledWith("tok", "mine", { name: "Robert", slots: [SLOTS[0][0]], note: "hi" })
            );
            expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
        });

        it("forgets the token on a 403 and shows the message", async () => {
            api.updateGuestEntry.mockRejectedValue(err("Your edit link is no longer valid.", 403));
            await openForm();
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            expect(await screen.findByRole("alert")).toHaveTextContent("no longer valid");
            expect(localStorage.getItem(KEY)).toBeNull();
        });

        it("keeps the token on other errors", async () => {
            api.updateGuestEntry.mockRejectedValue(err("This availability sheet is closed", 409));
            await openForm();
            fireEvent.click(screen.getAllByText("Save")[0]); // the form has Save at the top and bottom
            await screen.findByRole("alert");
            expect(localStorage.getItem(KEY)).toBe("mine");
        });

        it("withdraws after confirmation, clears the token and reloads without it", async () => {
            api.withdrawGuestEntry.mockResolvedValue(null);
            vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
            await openForm();

            fireEvent.click(screen.getByText("Remove my response"));
            expect(api.withdrawGuestEntry).not.toHaveBeenCalled();

            api.getGuestSheet.mockResolvedValue(guestView({ myEntry: null }));
            fireEvent.click(screen.getByText("Remove my response"));

            await waitFor(() => expect(api.withdrawGuestEntry).toHaveBeenCalledWith("tok", "mine"));
            expect(await screen.findByText("Your response was removed.")).toBeInTheDocument();
            expect(localStorage.getItem(KEY)).toBeNull();
            expect(api.getGuestSheet).toHaveBeenLastCalledWith("tok", null);
            expect(screen.getByText("+ Add my availability")).toBeInTheDocument();
        });

        it("shows an error when withdrawing fails", async () => {
            api.withdrawGuestEntry.mockRejectedValue(err("This availability sheet is closed", 409));
            vi.spyOn(window, "confirm").mockReturnValue(true);
            await openForm();
            fireEvent.click(screen.getByText("Remove my response"));
            expect(await screen.findByRole("alert")).toHaveTextContent("sheet is closed");
            expect(localStorage.getItem(KEY)).toBe("mine");
        });

        it("shows the load error if the reload after withdrawing fails", async () => {
            api.withdrawGuestEntry.mockResolvedValue(null);
            vi.spyOn(window, "confirm").mockReturnValue(true);
            await openForm();
            api.getGuestSheet.mockRejectedValue(err("gone", 404));
            fireEvent.click(screen.getByText("Remove my response"));
            expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
        });
    });

    describe("lost edit link", () => {
        async function open() {
            api.getGuestSheet.mockResolvedValue(guestView());
            renderPage();
            fireEvent.click(await screen.findByText("Already answered but lost your edit link?"));
        }

        it("emails a new link and shows the generic confirmation", async () => {
            api.recoverGuestLink.mockResolvedValue({ message: "If that email has a response, we've sent a link." });
            await open();
            fireEvent.change(screen.getByLabelText("Email"), { target: { value: " bob@x.com " } });
            fireEvent.click(screen.getByText("Email me a link"));
            expect(await screen.findByText(/we've sent a link/)).toBeInTheDocument();
            expect(api.recoverGuestLink).toHaveBeenCalledWith("tok", "bob@x.com");
        });

        it("shows an error if it can't send", async () => {
            api.recoverGuestLink.mockRejectedValue(err("Could not send the link.", 500));
            await open();
            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bob@x.com" } });
            fireEvent.click(screen.getByText("Email me a link"));
            expect(await screen.findByText("Could not send the link.")).toBeInTheDocument();
            expect(screen.getByText("Email me a link")).not.toBeDisabled();
        });
    });
});
