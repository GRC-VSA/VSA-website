import { describe, it, expect } from "vitest";
import { applyRectangle, heatColor, modeForPress } from "../gridSelection.js";

const slotStarts = [
    ["d0r0", "d0r1", "d0r2"],
    ["d1r0", "d1r1", "d1r2"],
    ["d2r0", "d2r1", "d2r2"],
];

describe("gridSelection", () => {
    it("modeForPress adds on free cells and removes on selected ones", () => {
        const sel = new Set(["d1r1"]);
        expect(modeForPress(sel, slotStarts, { day: 0, row: 0 })).toBe("add");
        expect(modeForPress(sel, slotStarts, { day: 1, row: 1 })).toBe("remove");
    });

    it("applyRectangle adds the full rectangle regardless of drag direction", () => {
        const result = applyRectangle(new Set(), slotStarts, { day: 2, row: 1 }, { day: 1, row: 0 }, "add");
        expect([...result].sort()).toEqual(["d1r0", "d1r1", "d2r0", "d2r1"]);
    });

    it("applyRectangle removes cells and leaves the rest, without mutating the base", () => {
        const base = new Set(["d0r0", "d0r1", "d2r2"]);
        const result = applyRectangle(base, slotStarts, { day: 0, row: 0 }, { day: 0, row: 1 }, "remove");
        expect([...result]).toEqual(["d2r2"]);
        expect(base.size).toBe(3);
    });

    it("a single-cell rectangle toggles just that cell", () => {
        const result = applyRectangle(new Set(), slotStarts, { day: 1, row: 2 }, { day: 1, row: 2 }, "add");
        expect([...result]).toEqual(["d1r2"]);
    });

    describe("heatColor", () => {
        it("is light grey for nobody or no max", () => {
            expect(heatColor(0, 5)).toBe("#f2f2f2");
            expect(heatColor(undefined, 5)).toBe("#f2f2f2");
            expect(heatColor(3, 0)).toBe("#f2f2f2");
        });
        it("interpolates between the light and dark green", () => {
            expect(heatColor(4, 4)).toBe("rgb(29, 158, 117)");
            // halfway between #DDF3EA (221, 243, 234) and #1D9E75 (29, 158, 117)
            expect(heatColor(2, 4)).toBe("rgb(125, 201, 176)");
        });
    });
});
