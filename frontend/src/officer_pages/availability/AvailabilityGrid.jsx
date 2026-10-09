// src/officer_pages/availability/AvailabilityGrid.jsx
import { useEffect, useRef, useState } from "react";
import { applyRectangle, heatColor, modeForPress } from "./gridSelection.js";
import { columnLabel, dayLabel, formatTime, timeToMinutes } from "./availabilityFormat.js";

/*
    The availability grid: one column per day, one row per slot.

    mode="view": the anonymous heatmap (darker navy = more people free). Your own slots get a red
                 marker on the left edge. Hovering a cell reports it through onHoverCell.
    mode="edit": click, or press and drag, to select a rectangle of slots. Works with mouse, pen
                 and touch. Keyboard: arrow keys move, Space or Enter toggles.

    Props:
      grid        { dates, times, slotStarts[day][row] } from the backend
      sheetType   "GENERAL" (old weekly sheets) shows weekday names without dates
      mode        "view" | "edit"
      heatmap     { visible, counts[day][row], maxCount, responderCount }
      selection   Set of slot-start strings (edit: the draft; view: your saved slots)
      onSelectionChange(nextSet)   edit mode
      onHoverCell({ day, row } | null)   view mode, optional
      minColumn   minimum column width in px (smaller when two grids sit side by side)
*/
export default function AvailabilityGrid({
                                             grid,
                                             sheetType,
                                             mode,
                                             heatmap,
                                             selection,
                                             onSelectionChange,
                                             onHoverCell,
                                             minColumn = 72,
                                         }) {
    const { dates, times, slotStarts } = grid;
    const editing = mode === "edit";
    const drag = useRef(null); // { anchor, last, mode, base }
    const gridRef = useRef(null);
    const [active, setActive] = useState({ day: 0, row: 0 });

    const slotLength = times.length > 1 ? timeToMinutes(times[1]) - timeToMinutes(times[0]) : 30;
    const rowHeight = slotLength >= 60 ? 40 : 24;

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
        // ignore cells of another grid on the page (edit view shows two side by side)
        if (!cellEl || cellEl.closest(".av-grid") !== gridRef.current) return null;
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
        const moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
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

    const showHeat = !editing && heatmap && heatmap.visible;
    const cellLabel = (day, row) => `${dayLabel(dates[day], sheetType)}, ${formatTime(times[row])}`;

    const cells = [<div key="corner" />];
    dates.forEach((date) => {
        const label = columnLabel(date, sheetType);
        cells.push(
            <div key={`h-${date}`} className="av-col-head">
                <div className="av-col-day">{label.day}</div>
                {label.date && <div className="av-col-date">{label.date}</div>}
            </div>
        );
    });

    times.forEach((time, row) => {
        const isHour = timeToMinutes(time) % 60 === 0;
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

            cells.push(
                <div
                    key={key}
                    id={`av-cell-${mode}-${day}-${row}`}
                    data-av-cell=""
                    data-day={day}
                    data-row={row}
                    role="gridcell"
                    aria-selected={editing ? selected : undefined}
                    title={showHeat ? `${cellLabel(day, row)}: ${count} of ${heatmap.responderCount} free` : cellLabel(day, row)}
                    className={classes.join(" ")}
                    style={showHeat ? { background: heatColor(count, heatmap.maxCount) } : undefined}
                    onPointerEnter={onHoverCell && !editing ? () => onHoverCell({ day, row }) : undefined}
                />
            );
        });
    });

    return (
        <div className="av-grid-scroll">
            <div
                ref={gridRef}
                className={`av-grid${editing ? " is-editing" : ""}`}
                role="grid"
                aria-label={editing ? "Your availability. Use arrow keys to move and Space to select." : "Group availability"}
                aria-activedescendant={editing ? `av-cell-${mode}-${active.day}-${active.row}` : undefined}
                tabIndex={editing ? 0 : -1}
                style={{
                    gridTemplateColumns: `64px repeat(${dates.length}, minmax(${minColumn}px, 1fr))`,
                    gridTemplateRows: `auto repeat(${times.length}, ${rowHeight}px)`,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerLeave={onHoverCell && !editing ? () => onHoverCell(null) : undefined}
                onKeyDown={handleKeyDown}
            >
                {cells}
            </div>
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
            <span>No one free</span>
            <span className="av-legend-bar" aria-hidden="true">
                {steps.map((c, i) => (
                    <span key={i} style={{ background: heatColor(c, max) }} />
                ))}
            </span>
            <span>
                Most free ({heatmap.maxCount} of {heatmap.responderCount})
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

/**
 * The group heatmap with everything around it: hover readout, colour key, and the "locked"
 * card shown until enough people have answered.
 */
export function GroupHeatmap({ grid, sheetType, heatmap, mySlots, minColumn, showReadout = true }) {
    const [hover, setHover] = useState(null);
    const locked = !heatmap.visible;
    const needed = heatmap.minResponders;
    const have = Math.min(heatmap.responderCount, needed);

    return (
        <div>
            {!locked && showReadout && (
                <p className="av-hover-line" aria-live="polite">
                    {hover ? (
                        <>
                            <strong>{dayLabel(grid.dates[hover.day], sheetType)}, {formatTime(grid.times[hover.row])}</strong>
                            {" · "}
                            {heatmap.counts[hover.day][hover.row]} of {heatmap.responderCount} free
                        </>
                    ) : (
                        "Point at a time to see how many people are free."
                    )}
                </p>
            )}
            <div className={`av-grid-frame${locked ? " is-locked" : ""}`}>
                <AvailabilityGrid
                    grid={grid}
                    sheetType={sheetType}
                    mode="view"
                    heatmap={heatmap}
                    selection={mySlots}
                    onSelectionChange={() => {}}
                    onHoverCell={setHover}
                    minColumn={minColumn}
                />
                {locked && (
                    <div className="av-locked">
                        <div className="av-locked-box">
                            <strong>Group view unlocks at {needed} responses</strong>
                            <p>
                                {heatmap.responderCount} of {needed} so far. Waiting keeps early answers
                                anonymous.
                            </p>
                            <div className="av-progress" aria-hidden="true">
                                <span style={{ width: `${(have / needed) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <HeatmapLegend heatmap={heatmap} showMine={mySlots.size > 0} />
        </div>
    );
}