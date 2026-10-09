import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import AvailabilityDetailPage from "../AvailabilityDetailPage.jsx";
import * as api from "../../../api/Availability.js";
import { detail, sheetInfo, SLOTS, visibleHeatmap } from "./fixtures.js";

vi.mock("../../../api/Availability.js");

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

function renderPage(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: "/officer/availability/5", state }]}>
            <Routes>
                <Route path="/officer/availability/:id" element={<AvailabilityDetailPage />} />
            </Routes>
        </MemoryRouter>
    );
}

const editGrid = () => screen.getByRole("grid", { name: /Your availability/ });
const back = () => screen.getByRole("button", { name: /Back to availability/ });

describe("AvailabilityDetailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.listInvites.mockResolvedValue([]);
    });

    it("shows loading, then sheet info, responders and the hidden-heatmap notice", async () => {
        api.getSheet.mockResolvedValue(detail({ sheet: sheetInfo({ closesAt: new Date(2030, 0, 3, 17, 0).toISOString() }) }));
        renderPage();

        expect(screen.getByText("Loading…")).toBeInTheDocument();
        expect(await screen.findByText("Board meeting")).toBeInTheDocument();
        expect(api.getSheet).toHaveBeenCalledWith("5");
        expect(screen.getByText("Pick a time")).toBeInTheDocument();
        expect(screen.getByText("Location")).toBeInTheDocument();
        expect(screen.getByText("SH 152")).toBeInTheDocument();
        expect(screen.getByText("Closes")).toBeInTheDocument();
        expect(screen.getByText("Jan 3, 5 PM")).toBeInTheDocument();
        expect(screen.getByText("Jan 7 - Jan 8, 9 AM - 10:30 AM")).toBeInTheDocument();
        expect(screen.getByText(/All times are in/)).toBeInTheDocument();
        expect(screen.getByText("Group view unlocks at 3 responses")).toBeInTheDocument();
        expect(screen.getByText("Amy Lee")).toBeInTheDocument();
        expect(screen.getByText("+ Add my availability")).toBeInTheDocument();
        expect(screen.queryByText("Manage this sheet")).not.toBeInTheDocument();
    });

    it("navigates back with the Return button", async () => {
        api.getSheet.mockResolvedValue(detail());
        renderPage();
        await screen.findByText("Board meeting");
        fireEvent.click(back());
        expect(navigate).toHaveBeenCalledWith("/officer/availability");
    });

    it("shows friendly text for a missing sheet and the raw message for other failures", async () => {
        api.getSheet.mockRejectedValueOnce(Object.assign(new Error("x"), { status: 404 }));
        const { unmount } = renderPage();
        expect(await screen.findByText("This sheet doesn't exist anymore.")).toBeInTheDocument();
        fireEvent.click(back());
        expect(navigate).toHaveBeenCalledWith("/officer/availability");
        unmount();

        api.getSheet.mockRejectedValueOnce(new Error("Server exploded"));
        renderPage();
        expect(await screen.findByText("Server exploded")).toBeInTheDocument();
    });

    it("shows the create-time error passed through router state", async () => {
        api.getSheet.mockResolvedValue(detail());
        renderPage({ createError: "The sheet was created, but the outside link wasn't" });
        expect(await screen.findByRole("alert")).toHaveTextContent("outside link wasn't");
    });

    it("visible heatmap: legend shows and the hidden notice does not", async () => {
        api.getSheet.mockResolvedValue(detail({ heatmap: visibleHeatmap, myEntry: { slots: [SLOTS[0][0]], note: null } }));
        renderPage();
        await screen.findByText("Board meeting");
        expect(screen.queryByText(/Group view unlocks/)).not.toBeInTheDocument();
        expect(screen.getByText("Most free (3 of 4)")).toBeInTheDocument();
        expect(screen.getByText("Your times")).toBeInTheDocument();
        expect(screen.getByText("Edit my availability")).toBeInTheDocument();
    });

    it("closed sheet: shows the pill, no add button and a Closed status", async () => {
        api.getSheet.mockResolvedValue(detail({ sheet: sheetInfo({ open: false, status: "CLOSED", closesAt: new Date(2030, 0, 3, 9, 0).toISOString(), location: null }) }));
        renderPage();
        expect(await screen.findByText("Closed", { selector: ".av-pill" })).toBeInTheDocument();
        expect(screen.queryByText(/Add my availability/)).not.toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.queryByText("Closes")).not.toBeInTheDocument();
    });

    it("hides the timezone note when the viewer is in the sheet's zone", async () => {
        const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        api.getSheet.mockResolvedValue(detail({ sheet: sheetInfo({ timezone: viewerZone }) }));
        renderPage();
        await screen.findByText("Board meeting");
        expect(screen.queryByText(/All times are in/)).not.toBeInTheDocument();
    });

    describe("editing my availability", () => {
        it("select a cell with the keyboard and save it with a trimmed note", async () => {
            api.getSheet.mockResolvedValue(detail());
            const updated = detail({ myEntry: { slots: [SLOTS[0][0]], note: "hi" } });
            api.saveMyEntry.mockResolvedValue(updated);
            renderPage();
            fireEvent.click(await screen.findByText("+ Add my availability"));

            expect(screen.getByText(/Click or drag across the times/)).toBeInTheDocument();
            expect(screen.getByText("Everyone so far")).toBeInTheDocument();
            expect(screen.queryByText("Remove my response")).not.toBeInTheDocument();

            fireEvent.keyDown(editGrid(), { key: " " });
            fireEvent.change(screen.getByLabelText(/Anything the organizer should know/), { target: { value: "  hi  " } });
            fireEvent.click(screen.getByText("Save"));

            await waitFor(() => expect(api.saveMyEntry).toHaveBeenCalledWith(5, [SLOTS[0][0]], "hi"));
            expect(await screen.findByText("Edit my availability")).toBeInTheDocument();
        });

        it("saves an empty selection with a null note", async () => {
            api.getSheet.mockResolvedValue(detail());
            api.saveMyEntry.mockResolvedValue(detail());
            renderPage();
            fireEvent.click(await screen.findByText("+ Add my availability"));
            fireEvent.click(screen.getByText("Save"));
            await waitFor(() => expect(api.saveMyEntry).toHaveBeenCalledWith(5, [], null));
        });

        it("starts from the saved entry and Cancel discards edits", async () => {
            api.getSheet.mockResolvedValue(detail({ myEntry: { slots: [SLOTS[0][0]], note: "old note" } }));
            renderPage();
            fireEvent.click(await screen.findByText("Edit my availability"));

            expect(screen.getByLabelText(/Anything the organizer should know/)).toHaveValue("old note");
            expect(editGrid().querySelector(".is-selected")).not.toBeNull();
            fireEvent.click(screen.getByText("Cancel"));
            expect(api.saveMyEntry).not.toHaveBeenCalled();
            expect(screen.getByText("Edit my availability")).toBeInTheDocument();
        });

        it("shows the error and stays in edit mode when saving fails", async () => {
            api.getSheet.mockResolvedValue(detail());
            api.saveMyEntry.mockRejectedValue(new Error("This availability sheet is closed"));
            renderPage();
            fireEvent.click(await screen.findByText("+ Add my availability"));
            fireEvent.click(screen.getByText("Save"));
            expect(await screen.findByRole("alert")).toHaveTextContent("sheet is closed");
            expect(screen.getByText("Save")).not.toBeDisabled();
        });

        it("can withdraw my response after confirming", async () => {
            const before = detail({ myEntry: { slots: [SLOTS[0][0]], note: null } });
            api.getSheet.mockResolvedValueOnce(before).mockResolvedValueOnce(detail());
            api.deleteMyEntry.mockResolvedValue(null);
            vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
            renderPage();
            fireEvent.click(await screen.findByText("Edit my availability"));

            fireEvent.click(screen.getByText("Remove my response"));
            expect(api.deleteMyEntry).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText("Remove my response"));
            await waitFor(() => expect(api.deleteMyEntry).toHaveBeenCalledWith(5));
            expect(await screen.findByText("+ Add my availability")).toBeInTheDocument();
            expect(api.getSheet).toHaveBeenCalledTimes(2);
        });
    });

    describe("managing the sheet", () => {
        it("close: shows the closed state from the response", async () => {
            api.getSheet.mockResolvedValue(detail({ canManage: true }));
            api.closeSheet.mockResolvedValue(detail({ canManage: true, sheet: sheetInfo({ open: false, status: "CLOSED" }) }));
            renderPage();
            fireEvent.click(await screen.findByText("Close sheet"));
            expect(await screen.findByText("Reopen sheet")).toBeInTheDocument();
            expect(screen.getByText("Reopening lets people answer again.")).toBeInTheDocument();
            expect(api.closeSheet).toHaveBeenCalledWith(5);
        });

        it("reopen: shows the open state again", async () => {
            api.getSheet.mockResolvedValue(detail({ canManage: true, sheet: sheetInfo({ open: false, status: "CLOSED" }) }));
            api.reopenSheet.mockResolvedValue(detail({ canManage: true }));
            renderPage();
            fireEvent.click(await screen.findByText("Reopen sheet"));
            expect(await screen.findByText("Close sheet")).toBeInTheDocument();
            expect(api.reopenSheet).toHaveBeenCalledWith(5);
        });

        it("close failure shows an error", async () => {
            api.getSheet.mockResolvedValue(detail({ canManage: true }));
            api.closeSheet.mockRejectedValue(new Error("Only the creator can do this"));
            renderPage();
            fireEvent.click(await screen.findByText("Close sheet"));
            expect(await screen.findByRole("alert")).toHaveTextContent("Only the creator");
        });

        it("delete: asks first, then goes back to the list", async () => {
            api.getSheet.mockResolvedValue(detail({ canManage: true }));
            api.deleteSheet.mockResolvedValue(null);
            vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
            renderPage();
            fireEvent.click(await screen.findByText("Delete sheet"));
            expect(api.deleteSheet).not.toHaveBeenCalled();
            fireEvent.click(screen.getByText("Delete sheet"));
            await waitFor(() => expect(navigate).toHaveBeenCalledWith("/officer/availability"));
            expect(api.deleteSheet).toHaveBeenCalledWith(5);
        });

        it("remove a responder: asks first, deletes, then refreshes the sheet", async () => {
            api.getSheet.mockResolvedValue(detail({ canManage: true }));
            api.removeEntry.mockResolvedValue(null);
            vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
            renderPage();
            const button = await screen.findByLabelText("Remove Gus's response");

            fireEvent.click(button);
            expect(api.removeEntry).not.toHaveBeenCalled();

            fireEvent.click(button);
            await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith(3));
            await waitFor(() => expect(api.getSheet).toHaveBeenCalledTimes(2));
        });
    });
});
