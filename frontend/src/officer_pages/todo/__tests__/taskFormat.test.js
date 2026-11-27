import { describe, it, expect } from "vitest";
import { dueState, formatDate, sortTasks, statusClass, summarize } from "../taskFormat.js";
import { task } from "./fixtures.js";

const TODAY = "2026-11-25";

describe("taskFormat", () => {
    it("formats plain dates without shifting the day", () => {
        expect(formatDate("2026-11-27")).toBe("Nov 27, 2026");
        expect(formatDate("2026-12-01")).toBe("Dec 1, 2026");
    });

    it("flags open tasks as overdue or due today, never completed ones", () => {
        expect(dueState(task({ dueDate: "2026-11-24" }), TODAY)).toBe("overdue");
        expect(dueState(task({ dueDate: TODAY }), TODAY)).toBe("today");
        expect(dueState(task({ dueDate: "2026-11-26" }), TODAY)).toBeNull();
        expect(dueState(task({ dueDate: "2026-11-20", status: "COMPLETED" }), TODAY)).toBeNull();
    });

    it("sorts open tasks by due date and puts completed tasks last", () => {
        const sorted = sortTasks([
            task({ taskId: 1, dueDate: "2026-11-20", status: "COMPLETED" }),
            task({ taskId: 2, dueDate: "2026-12-01" }),
            task({ taskId: 3, dueDate: "2026-11-24", status: "IN_PROGRESS" }),
            task({ taskId: 4, dueDate: "2026-11-27" }),
        ]);
        expect(sorted.map((t) => t.taskId)).toEqual([3, 4, 2, 1]);
    });

    it("counts open, due within 7 days (from today) and overdue tasks", () => {
        const counts = summarize(
            [
                task({ dueDate: "2026-11-24", status: "IN_PROGRESS" }), // overdue
                task({ dueDate: TODAY }), // today
                task({ dueDate: "2026-12-02" }), // 7 days out
                task({ dueDate: "2026-12-03" }), // 8 days out
                task({ dueDate: "2026-11-20", status: "COMPLETED" }),
            ],
            TODAY,
        );
        expect(counts).toEqual({ open: 4, dueSoon: 2, overdue: 1 });
    });

    it("builds status pill classes", () => {
        expect(statusClass("IN_PROGRESS")).toBe("td-status--in-progress");
        expect(statusClass("TODO")).toBe("td-status--todo");
    });
});
