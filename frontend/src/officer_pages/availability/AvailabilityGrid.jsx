// src/officer_pages/availability/AvailabilityGrid.jsx
import { useEffect, useRef, useState } from "react";
import { applyRectangle, heatColor, modeForPress } from "./gridSelection.js";
import { dayOfMonth, formatShortDate, formatTime, timeToMinutes, weekdayShort } from "./availabilityFormat.js";

/*
    The availability grid: one column per day, one row per slot.

    mode="view": shows the anonymous heatmap (darker = more people free). Your own slots get a
                 dark marker on the left edge.
    mode="edit": click, or press and drag, to select a rectangle of slots. Works with mouse, pen
                 and touch. Keyboard: arrow keys move, Space or Enter toggles.

    Props:
      grid        { dates, times, slotStarts[day][row] } from the backend
      sheetType   "GENERAL" hides day numbers (a sample week, not real dates)
      mode        "view" | "edit"
      heatmap     { visible, counts[day][row], maxCount, responderCount } (view mode)
      selection   Set of slot-start strings (edit mode: the draft; view mode: your saved slots)
      onSelectionChange(nextSet)   edit mode only
*/
export default function AvailabilityGrid({ grid, sheetType, mode, heatmap, selection, onSelectionChange }) {
    const { dates, times, slotStarts } = grid;
    const editing = mode === "edit";
    const drag = useRef(null); // { anchor, last, mode, base }
    const [active, setActive] = useState({ day: 0, row: 0 });

    const slotLength = times.length > 1 ? timeToMinutes(times[1]) - timeToMinutes(times[0]) : 30;
    const rowHeight = slotLength >= 60 ? 26 : 16;

    // End a drag wherever the pointer is released, even outside the grid.
    useEffect(() => {
        const stop = () => {
            drag.current = null;
        };
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, []);

    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const cellEl = el && el.closest ? el.closest("[data-av-cell]") : null;
        if (!cellEl) return null;
        return { day: Number(cellEl.dataset.day), row: Number(cellEl.dataset.row) };
    }

    function handlePointerDown(e) {
        if (!editing || (e.pointerType === "mouse" && e.button !== 0)) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        e.preventDefault();
        const dragMode = modeForPress(selection, slotStarts, cell);
        drag.current = { anchor: cell, last: cell, mode: dragMode, base: new Set(selection) };
        setActive(cell);
        onSelectionChange(applyRectangle(drag.current.base, slotStarts, cell, cell, dragMode));
    }

    function handlePointerMove(e) {
        const d = drag.current;
        if (!d) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell || (cell.day === d.last.day && cell.row === d.last.row)) return;
        d.last = cell;
        onSelectionChange(applyRectangle(d.base, slotStarts, d.anchor, cell, d.mode));
    }

    function handleKeyDown(e) {
        if (!editing) return;
        const moves = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
        };
        if (moves[e.key]) {
            e.preventDefault();
            const [dx, dy] = moves[e.key];
            setActive((a) => ({
                day: Math.min(dates.length - 1, Math.max(0, a.day + dx)),
                row: Math.min(times.length - 1, Math.max(0, a.row + dy)),
            }));
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            const key = slotStarts[active.day][active.row];
            const next = new Set(selection);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            onSelectionChange(next);
        }
    }

    const cellLabel = (day, row) => {
        const date = sheetType === "GENERAL" ? weekdayShort(dates[day]) : `${weekdayShort(dates[day])} ${formatShortDate(dates[day])}`;
        return `${date}, ${formatTime(times[row])}`;
    };

    const showHeat = !editing && heatmap && heatmap.visible;

    const cells = [];
    // header row
    cells.push(<div key="corner" />);
    dates.forEach((date) => {
        cells.push(
            <div key={`h-${date}`} className="av-col-head">
                {weekdayShort(date)}
                {sheetType !== "GENERAL" && <span>{dayOfMonth(date)}</span>}
            </div>
        );
    });

    times.forEach((time, row) => {
        const minutes = timeToMinutes(time);
        const isHour = minutes % 60 === 0;
        cells.push(
            <div key={`t-${time}`} className="av-time" aria-hidden="true">
                {isHour || row === 0 ? formatTime(time) : ""}
            </div>
        );
        dates.forEach((date, day) => {
            const key = slotStarts[day][row];
            const selected = selection.has(key);
            const count = showHeat ? heatmap.counts[day][row] : 0;
            const classes = ["av-cell"];
            if (isHour) classes.push("is-hour");
            if (row === times.length - 1) classes.push("is-last-row");
            if (day === dates.length - 1) classes.push("is-last-col");
            if (editing && selected) classes.push("is-selected");
            if (!editing && selected) classes.push("is-mine");
            if (editing && active.day === day && active.row === row) classes.push("is-active");

            const title = editing
                ? cellLabel(day, row)
                : showHeat
                    ? `${cellLabel(day, row)}: ${count} of ${heatmap.responderCount} free`
                    : cellLabel(day, row);

            cells.push(
                <div
                    key={key}
                    id={`av-cell-${day}-${row}`}
                    data-av-cell=""
                    data-day={day}
                    data-row={row}
                    role="gridcell"
                    aria-selected={editing ? selected : undefined}
                    title={title}
                    className={classes.join(" ")}
                    style={showHeat ? { background: heatColor(count, heatmap.maxCount) } : undefined}
                />
            );
        });
    });

    return (
        <div
            className={`av-grid${editing ? " is-editing" : ""}`}
            role="grid"
            aria-label={editing ? "Your availability. Use arrow keys to move and Space to select." : "Group availability"}
            aria-activedescendant={editing ? `av-cell-${active.day}-${active.row}` : undefined}
            tabIndex={editing ? 0 : -1}
            style={{
                gridTemplateColumns: `56px repeat(${dates.length}, minmax(42px, 1fr))`,
                gridTemplateRows: `auto repeat(${times.length}, ${rowHeight}px)`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onKeyDown={handleKeyDown}
        >
            {cells}
        </div>
    );
}

/** Colour key shown under the heatmap. */
export function HeatmapLegend({ heatmap, showMine }) {
    if (!heatmap || !heatmap.visible) return null;
    const max = Math.max(heatmap.maxCount, 1);
    const steps = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * max));
    return (
        <div className="av-legend">
            <span>0 free</span>
            <span className="av-legend-bar" aria-hidden="true">
                {steps.map((c, i) => (
                    <span key={i} style={{ background: heatColor(c, max) }} />
                ))}
            </span>
            <span>
                {heatmap.maxCount} of {heatmap.responderCount} free
            </span>
            {showMine && (
                <>
                    <span className="av-legend-mine" aria-hidden="true" />
                    <span>Your times</span>
                </>
            )}
        </div>
    );
}
