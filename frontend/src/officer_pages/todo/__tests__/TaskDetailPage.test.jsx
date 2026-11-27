import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
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
});
