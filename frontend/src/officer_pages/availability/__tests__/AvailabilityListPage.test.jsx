import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import AvailabilityListPage from "../AvailabilityListPage.jsx";
import * as api from "../../../api/Availability.js";

vi.mock("../../../api/Availability.js");

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

const sheet = (over = {}) => ({
    sheetId: 1, title: "Retreat", description: "Plan it", location: "Lodge", sheetType: "MEETING",
    dateStart: "2030-03-04", dateEnd: "2030-03-05", closesAt: null, open: true, responseCount: 2,
    answeredByMe: false, canManage: false, ...over,
});

const renderPage = () => render(<MemoryRouter><AvailabilityListPage /></MemoryRouter>);

describe("AvailabilityListPage", () => {
    beforeEach(() => vi.clearAllMocks());

    it("shows a loading state then an empty state with a collect button", async () => {
        api.listSheets.mockResolvedValue([]);
        renderPage();
        expect(screen.getByText("Loading…")).toBeInTheDocument();
        expect(await screen.findByText(/No availability sheets yet/)).toBeInTheDocument();

        fireEvent.click(screen.getAllByText("+ Collect availability")[1]);
        expect(navigate).toHaveBeenCalledWith("/officer/availability/collect");
        expect(screen.queryByText("Delete sheets")).not.toBeInTheDocument();
    });

    it("shows a load error", async () => {
        api.listSheets.mockRejectedValue(new Error("server down"));
        renderPage();
        expect(await screen.findByRole("alert")).toHaveTextContent("server down");
        expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    });

    it("groups open sheets into events and meetings, with closed sheets folded away", async () => {
        api.listSheets.mockResolvedValue([
            sheet({ sheetId: 1, title: "Closed one", open: false, answeredByMe: true }),
            sheet({ sheetId: 2, title: "Open one", closesAt: new Date(2030, 0, 10, 17, 0).toISOString(), responseCount: 1 }),
            sheet({ sheetId: 3, title: "Weekly", sheetType: "GENERAL", dateStart: "2030-03-03", dateEnd: "2030-03-09", location: null, description: null, answeredByMe: true }),
            sheet({ sheetId: 4, title: "Gala", sheetType: "EVENT" }),
        ]);
        renderPage();
        await screen.findByText("Open one");

        expect(screen.getByRole("heading", { name: /Events/ })).toHaveTextContent("1 open");
        expect(screen.getByRole("heading", { name: /General meetings/ })).toHaveTextContent("2 open");
        const titles = Array.from(document.querySelectorAll(".av-sheet-title")).map((el) => el.textContent);
        expect(titles).toEqual(["Gala", "Open one", "Weekly"]);

        const open = screen.getByText("Open one").closest(".av-sheet-card");
        expect(within(open).getByText("Closes Jan 10, 5 PM")).toBeInTheDocument();
        expect(within(open).getByText("1 response")).toBeInTheDocument();
        expect(within(open).getByText("Needs your answer")).toBeInTheDocument();
        expect(within(open).getByText("Location")).toBeInTheDocument();
        expect(within(open).getByText("Mar")).toBeInTheDocument();

        const weekly = screen.getByText("Weekly", { selector: ".av-sheet-title" }).closest(".av-sheet-card");
        expect(within(weekly).getByText("Weekly", { selector: ".av-badge-month" })).toBeInTheDocument();
        expect(within(weekly).getByText("✓ You answered")).toBeInTheDocument();
        expect(within(weekly).queryByText("Location")).not.toBeInTheDocument();

        // closed sheets stay hidden until the toggle is opened
        expect(screen.queryByText("Closed one")).not.toBeInTheDocument();
        const toggle = screen.getByRole("button", { name: /Closed/ });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-expanded", "true");

        const closed = screen.getByText("Closed one").closest(".av-sheet-card");
        expect(closed).toHaveClass("is-closed");
        expect(within(closed).getByText("Closed")).toBeInTheDocument();
        expect(within(closed).queryByText("Needs your answer")).not.toBeInTheDocument();
    });

    it("opens a sheet by click and by Enter", async () => {
        api.listSheets.mockResolvedValue([sheet({ sheetId: 9 })]);
        renderPage();
        const row = (await screen.findByText("Retreat")).closest(".av-sheet-card");
        fireEvent.click(row);
        expect(navigate).toHaveBeenCalledWith("/officer/availability/9");
        navigate.mockClear();
        fireEvent.keyDown(row, { key: "a" });
        expect(navigate).not.toHaveBeenCalled();
        fireEvent.keyDown(row, { key: "Enter" });
        expect(navigate).toHaveBeenCalledWith("/officer/availability/9");
    });

    it("delete mode: only manageable rows get a button; confirm deletes and removes the row", async () => {
        api.listSheets.mockResolvedValue([sheet({ sheetId: 1, title: "Mine", canManage: true }), sheet({ sheetId: 2, title: "Theirs" })]);
        api.deleteSheet.mockResolvedValue(null);
        vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
        renderPage();
        await screen.findByText("Mine");
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("Delete sheets"));
        expect(screen.getByText("Done")).toHaveAttribute("aria-pressed", "true");
        const buttons = screen.getAllByRole("button", { name: "Delete" });
        expect(buttons).toHaveLength(1);

        fireEvent.click(buttons[0]);
        expect(api.deleteSheet).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled(); // click did not bubble to open the row

        fireEvent.click(buttons[0]);
        await waitFor(() => expect(screen.queryByText("Mine")).not.toBeInTheDocument());
        expect(api.deleteSheet).toHaveBeenCalledWith(1);
        expect(screen.getByText("Theirs")).toBeInTheDocument();
    });

    it("delete mode can be toggled off again", async () => {
        api.listSheets.mockResolvedValue([sheet({ canManage: true })]);
        renderPage();
        await screen.findByText("Retreat");
        fireEvent.click(screen.getByText("Delete sheets"));
        fireEvent.click(screen.getByText("Done"));
        expect(screen.getByText("Delete sheets")).toHaveAttribute("aria-pressed", "false");
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    });

    it("shows an error if deleting fails", async () => {
        api.listSheets.mockResolvedValue([sheet({ canManage: true })]);
        api.deleteSheet.mockRejectedValue(new Error("cannot delete"));
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Retreat");
        fireEvent.click(screen.getByText("Delete sheets"));
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("cannot delete");
        expect(screen.getByText("Retreat")).toBeInTheDocument();
    });

    it("the header button starts the collect flow", async () => {
        api.listSheets.mockResolvedValue([sheet()]);
        renderPage();
        await screen.findByText("Retreat");
        fireEvent.click(screen.getByText("+ Collect availability"));
        expect(navigate).toHaveBeenCalledWith("/officer/availability/collect");
    });
});
