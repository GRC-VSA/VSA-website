import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import AvailabilityGrid, { HeatmapLegend } from "../AvailabilityGrid.jsx";
import { grid, SLOTS, visibleHeatmap, hiddenHeatmap } from "./fixtures.js";

const cell = (day, row) => document.getElementById(`av-cell-${day}-${row}`);

describe("AvailabilityGrid", () => {
    beforeEach(() => {
        document.elementFromPoint = vi.fn();
    });
    afterEach(() => {
        delete document.elementFromPoint;
    });

    it("renders a header per day and a cell per slot, labelling hours", () => {
        render(<AvailabilityGrid grid={grid()} sheetType="MEETING" mode="view" selection={new Set()} onSelectionChange={() => {}} />);

        expect(screen.getByRole("grid", { name: "Group availability" })).toBeInTheDocument();
        expect(screen.getAllByRole("gridcell")).toHaveLength(6);
        expect(screen.getByText("Mon")).toBeInTheDocument();
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(screen.getByText("9 AM")).toBeInTheDocument();
        expect(screen.getByText("10 AM")).toBeInTheDocument();
        expect(screen.queryByText("9:30 AM")).not.toBeInTheDocument();
        expect(cell(1, 2)).toHaveClass("is-last-row", "is-last-col");
    });

    it("hides day numbers for GENERAL sheets and labels cells by weekday only", () => {
        render(<AvailabilityGrid grid={grid()} sheetType="GENERAL" mode="view" selection={new Set()} onSelectionChange={() => {}} />);
        expect(screen.queryByText("7")).not.toBeInTheDocument();
        expect(cell(0, 0)).toHaveAttribute("title", "Mon, 9 AM");
    });

    it("uses a 60-minute row height when slots are an hour long", () => {
        const g = { ...grid(), times: ["09:00", "10:00"], slotStarts: [[SLOTS[0][0], SLOTS[0][1]], [SLOTS[1][0], SLOTS[1][1]]] };
        render(<AvailabilityGrid grid={g} sheetType="MEETING" mode="view" selection={new Set()} onSelectionChange={() => {}} />);
        expect(screen.getByRole("grid").style.gridTemplateRows).toContain("26px");
    });

    it("view mode: shows heat colours, counts in titles and marks my slots", () => {
        render(
            <AvailabilityGrid
                grid={grid()}
                sheetType="MEETING"
                mode="view"
                heatmap={visibleHeatmap}
                selection={new Set([SLOTS[0][0]])}
                onSelectionChange={() => {}}
            />
        );
        expect(cell(0, 0)).toHaveAttribute("title", "Mon Jan 7, 9 AM: 3 of 4 free");
        expect(cell(0, 0).style.background).toBe("rgb(29, 158, 117)");
        expect(cell(0, 2).style.background).toBe("rgb(242, 242, 242)");
        expect(cell(0, 0)).toHaveClass("is-mine");
        expect(cell(0, 0)).not.toHaveAttribute("aria-selected");
    });

    it("view mode with a hidden heatmap shows no counts", () => {
        render(<AvailabilityGrid grid={grid()} sheetType="MEETING" mode="view" heatmap={hiddenHeatmap} selection={new Set()} onSelectionChange={() => {}} />);
        expect(cell(0, 0)).toHaveAttribute("title", "Mon Jan 7, 9 AM");
        expect(cell(0, 0).style.background).toBe("");
    });

    it("view mode ignores pointer and keyboard input", () => {
        const onChange = vi.fn();
        render(<AvailabilityGrid grid={grid()} sheetType="MEETING" mode="view" selection={new Set()} onSelectionChange={onChange} />);
        document.elementFromPoint.mockReturnValue(cell(0, 0));
        fireEvent.pointerDown(screen.getByRole("grid"));
        fireEvent.keyDown(screen.getByRole("grid"), { key: " " });
        expect(onChange).not.toHaveBeenCalled();
    });

    describe("edit mode", () => {
        function setup(selection = new Set()) {
            const onChange = vi.fn();
            render(<AvailabilityGrid grid={grid()} sheetType="MEETING" mode="edit" selection={selection} onSelectionChange={onChange} />);
            return { onChange, gridEl: screen.getByRole("grid") };
        }

        it("pressing a free cell selects it", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(1, 1));
            fireEvent.pointerDown(gridEl);
            expect([...onChange.mock.calls[0][0]]).toEqual([SLOTS[1][1]]);
            expect(cell(1, 1)).toHaveClass("is-active");
        });

        it("pressing a selected cell removes it", () => {
            const { onChange, gridEl } = setup(new Set([SLOTS[0][0], SLOTS[0][1]]));
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            fireEvent.pointerDown(gridEl);
            expect([...onChange.mock.calls[0][0]]).toEqual([SLOTS[0][1]]);
        });

        it("dragging selects a rectangle and shrinking it restores cells", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            fireEvent.pointerDown(gridEl);
            document.elementFromPoint.mockReturnValue(cell(1, 1));
            fireEvent.pointerMove(gridEl);
            expect(onChange.mock.lastCall[0].size).toBe(4);

            document.elementFromPoint.mockReturnValue(cell(0, 1));
            fireEvent.pointerMove(gridEl);
            expect(onChange.mock.lastCall[0].size).toBe(2);
        });

        it("moving within the same cell does nothing more", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            fireEvent.pointerDown(gridEl);
            fireEvent.pointerMove(gridEl);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("moving over a non-cell is ignored", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            fireEvent.pointerDown(gridEl);
            document.elementFromPoint.mockReturnValue(null);
            fireEvent.pointerMove(gridEl);
            document.elementFromPoint.mockReturnValue(document.body);
            fireEvent.pointerMove(gridEl);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("releasing the pointer anywhere ends the drag", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            fireEvent.pointerDown(gridEl);
            fireEvent.pointerUp(window);
            document.elementFromPoint.mockReturnValue(cell(1, 1));
            fireEvent.pointerMove(gridEl);
            expect(onChange).toHaveBeenCalledTimes(1);

            fireEvent.pointerDown(gridEl);
            fireEvent(window, new Event("pointercancel"));
            fireEvent.pointerMove(gridEl);
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it("pressing outside any cell does nothing; pointer move without a drag does nothing", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(null);
            fireEvent.pointerDown(gridEl);
            fireEvent.pointerMove(gridEl);
            expect(onChange).not.toHaveBeenCalled();
        });

        it("non-primary mouse buttons are ignored", () => {
            const { onChange, gridEl } = setup();
            document.elementFromPoint.mockReturnValue(cell(0, 0));
            const event = new Event("pointerdown", { bubbles: true, cancelable: true });
            event.pointerType = "mouse";
            event.button = 2;
            fireEvent(gridEl, event);
            expect(onChange).not.toHaveBeenCalled();
        });

        it("keyboard: arrows move the active cell (clamped) and Space/Enter toggle", () => {
            const { onChange, gridEl } = setup(new Set([SLOTS[1][1]]));
            expect(gridEl).toHaveAttribute("aria-activedescendant", "av-cell-0-0");

            fireEvent.keyDown(gridEl, { key: "ArrowLeft" });
            fireEvent.keyDown(gridEl, { key: "ArrowUp" });
            expect(gridEl).toHaveAttribute("aria-activedescendant", "av-cell-0-0");

            fireEvent.keyDown(gridEl, { key: "ArrowRight" });
            fireEvent.keyDown(gridEl, { key: "ArrowRight" });
            fireEvent.keyDown(gridEl, { key: "ArrowDown" });
            expect(gridEl).toHaveAttribute("aria-activedescendant", "av-cell-1-1");

            fireEvent.keyDown(gridEl, { key: " " });
            expect(onChange.mock.lastCall[0].has(SLOTS[1][1])).toBe(false);

            fireEvent.keyDown(gridEl, { key: "ArrowDown" });
            fireEvent.keyDown(gridEl, { key: "ArrowDown" });
            fireEvent.keyDown(gridEl, { key: "Enter" });
            expect(onChange.mock.lastCall[0].has(SLOTS[1][2])).toBe(true);

            fireEvent.keyDown(gridEl, { key: "x" });
            expect(onChange).toHaveBeenCalledTimes(2);
        });
    });
});

describe("HeatmapLegend", () => {
    it("renders nothing when there is no visible heatmap", () => {
        const { container, rerender } = render(<HeatmapLegend heatmap={null} />);
        expect(container).toBeEmptyDOMElement();
        rerender(<HeatmapLegend heatmap={hiddenHeatmap} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the max, the responder count and optionally 'Your times'", () => {
        const { rerender } = render(<HeatmapLegend heatmap={visibleHeatmap} />);
        expect(screen.getByText("3 of 4 free")).toBeInTheDocument();
        expect(screen.queryByText("Your times")).not.toBeInTheDocument();
        rerender(<HeatmapLegend heatmap={visibleHeatmap} showMine />);
        expect(screen.getByText("Your times")).toBeInTheDocument();
    });

    it("copes with a zero max", () => {
        render(<HeatmapLegend heatmap={{ ...visibleHeatmap, maxCount: 0 }} />);
        expect(screen.getByText("0 of 4 free")).toBeInTheDocument();
    });
});
