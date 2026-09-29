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

        fireEvent.click(screen.getAllByText("Collect new availability")[1]);
        expect(navigate).toHaveBeenCalledWith("collect");
        expect(screen.queryByText("Delete availability")).not.toBeInTheDocument();
    });

    it("shows a load error", async () => {
        api.listSheets.mockRejectedValue(new Error("server down"));
        renderPage();
        expect(await screen.findByRole("alert")).toHaveTextContent("server down");
        expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    });

    it("lists sheets sorted open-first with badges, status and location", async () => {
        api.listSheets.mockResolvedValue([
            sheet({ sheetId: 1, title: "Closed one", open: false, answeredByMe: true }),
            sheet({ sheetId: 2, title: "Open one", closesAt: new Date(2030, 0, 10, 17, 0).toISOString(), responseCount: 1 }),
            sheet({ sheetId: 3, title: "Weekly", sheetType: "GENERAL", dateStart: "2030-03-03", dateEnd: "2030-03-09", location: null, description: null, answeredByMe: true }),
        ]);
        renderPage();
        await screen.findByText("Open one");

        const titles = Array.from(document.querySelectorAll(".av-row-title")).map((el) => el.textContent);
        expect(titles).toEqual(["Open one", "Weekly", "Closed one"]);

        const open = screen.getByText("Open one").closest(".av-row");
        expect(within(open).getByText("Closes Jan 10, 5 PM")).toBeInTheDocument();
        expect(within(open).getByText("1 response")).toBeInTheDocument();
        expect(within(open).getByText("Not answered yet")).toBeInTheDocument();
        expect(within(open).getByText("Location")).toBeInTheDocument();
        expect(within(open).getByText("Mar")).toBeInTheDocument();

        const closed = screen.getByText("Closed one").closest(".av-row");
        expect(closed).toHaveClass("is-closed");
        expect(within(closed).getByText("Closed")).toBeInTheDocument();
        expect(within(closed).getByText("✓ You answered")).toBeInTheDocument();
        expect(within(closed).queryByText("Not answered yet")).not.toBeInTheDocument();

        const weekly = screen.getByText("Weekly", { selector: ".av-row-title" }).closest(".av-row");
        expect(within(weekly).getByText("Weekly", { selector: ".av-badge-month" })).toBeInTheDocument();
        expect(within(weekly).queryByText("Location")).not.toBeInTheDocument();
    });

    it("opens a sheet by click and by Enter", async () => {
        api.listSheets.mockResolvedValue([sheet({ sheetId: 9 })]);
        renderPage();
        const row = (await screen.findByText("Retreat")).closest(".av-row");
        fireEvent.click(row);
        expect(navigate).toHaveBeenCalledWith("9");
        navigate.mockClear();
        fireEvent.keyDown(row, { key: "a" });
        expect(navigate).not.toHaveBeenCalled();
        fireEvent.keyDown(row, { key: "Enter" });
        expect(navigate).toHaveBeenCalledWith("9");
    });

    it("delete mode: only manageable rows get a button; confirm deletes and removes the row", async () => {
        api.listSheets.mockResolvedValue([sheet({ sheetId: 1, title: "Mine", canManage: true }), sheet({ sheetId: 2, title: "Theirs" })]);
        api.deleteSheet.mockResolvedValue(null);
        vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
        renderPage();
        await screen.findByText("Mine");
        expect(screen.queryByText("Delete", { selector: "button.av-row-delete" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("Delete availability"));
        expect(screen.getByText("Done deleting")).toHaveAttribute("aria-pressed", "true");
        const buttons = screen.getAllByText("Delete", { selector: "button" });
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
        fireEvent.click(screen.getByText("Delete availability"));
        fireEvent.click(screen.getByText("Done deleting"));
        expect(screen.getByText("Delete availability")).toHaveAttribute("aria-pressed", "false");
        expect(screen.queryByText("Delete", { selector: "button.av-row-delete" })).not.toBeInTheDocument();
    });

    it("shows an error if deleting fails", async () => {
        api.listSheets.mockResolvedValue([sheet({ canManage: true })]);
        api.deleteSheet.mockRejectedValue(new Error("cannot delete"));
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Retreat");
        fireEvent.click(screen.getByText("Delete availability"));
        fireEvent.click(screen.getByText("Delete", { selector: "button.av-row-delete" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("cannot delete");
        expect(screen.getByText("Retreat")).toBeInTheDocument();
    });

    it("the header button starts the collect flow", async () => {
        api.listSheets.mockResolvedValue([sheet()]);
        renderPage();
        await screen.findByText("Retreat");
        fireEvent.click(screen.getByText("Collect new availability"));
        expect(navigate).toHaveBeenCalledWith("collect");
    });
});
