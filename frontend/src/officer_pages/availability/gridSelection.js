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

/** Heatmap colour: light grey for nobody, deepening to the site's navy as more people are free. */
export function heatColor(count, max) {
    if (!count || !max) return "#f1f1f4";
    const t = count / max;
    // interpolate #DAD8EE (one person) -> #302B63 (everyone who answered)
    const from = [0xda, 0xd8, 0xee];
    const to = [0x30, 0x2b, 0x63];
    const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

/**
 * The best times to meet: runs of back-to-back slots on the same day where the same number of
 * people are free, most people first, then longest. Returns [{ day, startRow, endRow, count }].
 */
export function bestWindows(grid, heatmap, limit = 3) {
    if (!heatmap || !heatmap.visible || !heatmap.maxCount) return [];
    const windows = [];
    grid.slotStarts.forEach((column, day) => {
        let row = 0;
        while (row < column.length) {
            const count = heatmap.counts[day][row];
            let end = row;
            while (end + 1 < column.length && heatmap.counts[day][end + 1] === count) end++;
            if (count > 0) windows.push({ day, startRow: row, endRow: end, count });
            row = end + 1;
        }
    });
    windows.sort(
        (a, b) =>
            b.count - a.count ||
            b.endRow - b.startRow - (a.endRow - a.startRow) ||
            a.day - b.day ||
            a.startRow - b.startRow
    );
    return windows.slice(0, limit);
}