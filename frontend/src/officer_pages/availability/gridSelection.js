/*
    Selection logic for the drag-to-select grid (no React, so it is easy to test).

    Cells are addressed as { day, row } indexes into grid.slotStarts[day][row]. The selection is
    a Set of slot-start strings, exactly as the backend sent them.

    Dragging works like When2Meet: the cell you press decides the mode (press a free cell to add,
    press a selected cell to remove), and the rectangle between the pressed cell and the current
    cell is applied on top of the selection as it was when the drag began. Dragging back shrinks
    the rectangle and restores the cells you left.
*/

export function modeForPress(selection, slotStarts, cell) {
    return selection.has(slotStarts[cell.day][cell.row]) ? "remove" : "add";
}

export function applyRectangle(baseSelection, slotStarts, from, to, mode) {
    const next = new Set(baseSelection);
    const dayLo = Math.min(from.day, to.day);
    const dayHi = Math.max(from.day, to.day);
    const rowLo = Math.min(from.row, to.row);
    const rowHi = Math.max(from.row, to.row);

    for (let d = dayLo; d <= dayHi; d++) {
        for (let r = rowLo; r <= rowHi; r++) {
            const key = slotStarts[d][r];
            if (mode === "add") next.add(key);
            else next.delete(key);
        }
    }
    return next;
}

/** Heatmap colour: light grey for nobody, deepening green as more people are free. */
export function heatColor(count, max) {
    if (!count || !max) return "#f2f2f2";
    const t = count / max;
    // interpolate #DDF3EA -> #1D9E75
    const from = [0xdd, 0xf3, 0xea];
    const to = [0x1d, 0x9e, 0x75];
    const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}
