import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import TodoListPage from "../TodoListPage.jsx";
import * as api from "../../../api/Tasks.js";
import { dayFromToday, task } from "./fixtures.js";

vi.mock("../../../api/Tasks.js");
vi.mock("../../../context/AuthContext.jsx", () => ({ useAuth: () => ({ user: { role: "officer" } }) }));

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

const renderPage = (state) =>
    render(
        <MemoryRouter initialEntries={[{ pathname: "/officer/todo-list", state }]}>
            <TodoListPage />
        </MemoryRouter>,
    );

const sample = [
    task({ taskId: 1, title: "Share meeting notes", dueDate: dayFromToday(-2), status: "COMPLETED", priority: "LOW" }),
    task({ taskId: 2, title: "Confirm venue booking", dueDate: dayFromToday(-1), status: "IN_PROGRESS" }),
    task({ taskId: 3, title: "Confirm performance lineup", dueDate: dayFromToday(6), priority: "MEDIUM" }),
    task({ taskId: 4, title: "Finalize tournament format", dueDate: dayFromToday(0), status: "IN_PROGRESS" }),
];

describe("TodoListPage", () => {
    beforeEach(() => vi.clearAllMocks());

    it("shows a loading state, then an empty state that starts an assignment", async () => {
        api.listTasks.mockResolvedValue([]);
        renderPage();
        expect(screen.getByText("Loading…")).toBeInTheDocument();
        expect(await screen.findByText("No tasks yet")).toBeInTheDocument();

        const [, emptyButton] = screen.getAllByRole("button", { name: /Assign task/ });
        fireEvent.click(emptyButton);
        expect(navigate).toHaveBeenCalledWith("/officer/todo-list/assign");
    });

    it("shows a load error", async () => {
        api.listTasks.mockRejectedValue(new Error("server down"));
        renderPage();
        expect(await screen.findByRole("alert")).toHaveTextContent("server down");
        expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    });

    it("shows the summary and lists open tasks by due date with completed tasks last", async () => {
        api.listTasks.mockResolvedValue(sample);
        renderPage();
        await screen.findByText("Confirm venue booking");

        expect(screen.getByText("Executive officer view")).toBeInTheDocument();
        expect(screen.getByText(/All teams · 4 tasks/)).toBeInTheDocument();

        const summary = screen.getByRole("region", { name: "Task summary" });
        const value = (label) => within(summary).getByText(label).closest(".td-summary-card").querySelector(".td-summary-value");
        expect(value("Open tasks")).toHaveTextContent("3");
        expect(value("Due in 7 days")).toHaveTextContent("2");
        expect(value("Overdue")).toHaveTextContent("1");
        expect(value("Overdue")).toHaveClass("is-urgent");

        const titles = screen.getAllByRole("link").map((a) => a.textContent);
        expect(titles).toEqual([
            "Confirm venue booking",
            "Finalize tournament format",
            "Confirm performance lineup",
            "Share meeting notes",
        ]);

        const overdueRow = screen.getByText("Confirm venue booking").closest("tr");
        expect(within(overdueRow).getByText("Overdue")).toBeInTheDocument();
        expect(within(overdueRow).getByText("In progress")).toHaveClass("td-status--in-progress");
        expect(within(screen.getByText("Finalize tournament format").closest("tr")).getByText("Today")).toBeInTheDocument();
        expect(within(screen.getByText("Share meeting notes").closest("tr")).queryByText("Overdue")).not.toBeInTheDocument();
    });

    it("opens a task when its row is clicked", async () => {
        api.listTasks.mockResolvedValue(sample);
        renderPage();
        const row = (await screen.findByText("Confirm performance lineup")).closest("tr");
        fireEvent.click(within(row).getByText("Medium"));
        expect(navigate).toHaveBeenCalledWith("/officer/todo-list/3");
        expect(screen.getByRole("link", { name: "Confirm performance lineup" })).toHaveAttribute("href", "/officer/todo-list/3");
    });

    it("highlights a just-assigned task and offers to view it", async () => {
        api.listTasks.mockResolvedValue(sample);
        renderPage({ assignedTaskId: 3 });
        await screen.findByText("Confirm performance lineup");

        expect(screen.getByText("Confirm performance lineup").closest("tr")).toHaveClass("is-highlighted");
        expect(screen.getByRole("status")).toHaveTextContent("Task assigned.");
        expect(screen.queryByRole("button", { name: /Assign task/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "View task" }));
        expect(navigate).toHaveBeenCalledWith("/officer/todo-list/3");
    });
});
