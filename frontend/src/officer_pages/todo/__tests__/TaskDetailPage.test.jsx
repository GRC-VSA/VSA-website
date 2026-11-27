import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import TaskDetailPage from "../TaskDetailPage.jsx";
import * as api from "../../../api/Tasks.js";
import { dayFromToday, task } from "./fixtures.js";

vi.mock("../../../api/Tasks.js");

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

const renderPage = (taskId = "7") =>
    render(
        <MemoryRouter initialEntries={[`/officer/todo-list/${taskId}`]}>
            <Routes>
                <Route path="/officer/todo-list/:taskId" element={<TaskDetailPage />} />
            </Routes>
        </MemoryRouter>,
    );

describe("TaskDetailPage", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("shows the task's owner, deadline, description and activity", async () => {
        api.getTask.mockResolvedValue(task({ taskId: 7, dueDate: "2030-11-27", assignedByMe: true, assignedByRole: null }));
        renderPage();

        expect(await screen.findByRole("heading", { name: "Prepare volunteer briefing" })).toBeInTheDocument();
        expect(api.getTask).toHaveBeenCalledWith("7");
        expect(screen.getByText("Event Organizing")).toBeInTheDocument();
        expect(screen.getByText("To do", { selector: ".td-tag" })).toBeInTheDocument();
        expect(screen.getByText("High priority")).toHaveClass("is-high");
        expect(screen.getByText("Linh Nguyen")).toBeInTheDocument();
        expect(screen.getByText("Nov 27, 2030")).toBeInTheDocument();
        expect(screen.getByText("Assigned by you")).toBeInTheDocument();
        expect(screen.getByText("Nov 25, 2026")).toBeInTheDocument();
        expect(screen.getByText("Status: To do")).toBeInTheDocument();
    });

    it("names who assigned it and flags an overdue task", async () => {
        api.getTask.mockResolvedValue(task({ dueDate: dayFromToday(-1), status: "IN_PROGRESS" }));
        renderPage();

        expect(await screen.findByText("Assigned by An Nguyen · Executive officer")).toBeInTheDocument();
        expect(screen.getByText("Overdue")).toBeInTheDocument();
        expect(screen.getByText("In progress", { selector: ".td-tag" })).toHaveClass("td-status--in-progress");
    });

    it("shows an error when the task doesn't exist", async () => {
        api.getTask.mockRejectedValue(new Error("Task not found"));
        renderPage("999");
        expect(await screen.findByRole("alert")).toHaveTextContent("Task not found");
    });

    it("goes back to the team tasks", async () => {
        api.getTask.mockResolvedValue(task());
        renderPage();
        fireEvent.click(await screen.findByRole("button", { name: "Back to team tasks" }));
        expect(navigate).toHaveBeenCalledWith("/officer/todo-list");
    });

    it("hides the status and delete actions when the user may not use them", async () => {
        api.getTask.mockResolvedValue(task({ canChangeStatus: false, canEdit: false }));
        renderPage();
        await screen.findByRole("heading", { name: "Prepare volunteer briefing" });
        expect(screen.queryByText("Update status")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete task" })).not.toBeInTheDocument();
    });

    it("lets the assignee change the status and shows the server's answer", async () => {
        api.getTask.mockResolvedValue(task({ taskId: 7, canChangeStatus: true }));
        api.updateTaskStatus.mockResolvedValue(
            task({ taskId: 7, canChangeStatus: true, status: "COMPLETED", completedAt: new Date(2030, 0, 5, 12).toISOString() }),
        );
        renderPage();

        const current = await screen.findByRole("button", { name: "To do" });
        expect(current).toBeDisabled();
        expect(current).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(screen.getByRole("button", { name: "Completed" }));
        expect(api.updateTaskStatus).toHaveBeenCalledWith(7, "COMPLETED");
        expect(await screen.findByText("Status: Completed")).toBeInTheDocument();
        expect(screen.getByText("Completed Jan 5, 2030")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Completed" })).toBeDisabled();
    });

    it("shows why a status change was refused and keeps the old status", async () => {
        api.getTask.mockResolvedValue(task({ canChangeStatus: true }));
        api.updateTaskStatus.mockRejectedValue(new Error("Only the assignee can change its status"));
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: "In progress" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Only the assignee can change its status");
        expect(screen.getByText("Status: To do")).toBeInTheDocument();
    });

    it("deletes after confirming, then goes back to the list", async () => {
        api.getTask.mockResolvedValue(task({ taskId: 7, canEdit: true }));
        api.deleteTask.mockResolvedValue(null);
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: "Delete task" }));
        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/officer/todo-list"));
        expect(api.deleteTask).toHaveBeenCalledWith(7);
    });

    it("does nothing when the delete is cancelled", async () => {
        api.getTask.mockResolvedValue(task({ canEdit: true }));
        vi.spyOn(window, "confirm").mockReturnValue(false);
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: "Delete task" }));
        expect(api.deleteTask).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });
});
