import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import AssignTaskPage from "../AssignTaskPage.jsx";
import * as api from "../../../api/Tasks.js";
import { dayFromToday, members } from "./fixtures.js";

vi.mock("../../../api/Tasks.js");

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

/** Renders the page and waits for the member list, which enables the "Assign to" field. */
async function renderPage() {
    render(<MemoryRouter><AssignTaskPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("button", { name: /Assign to/ })).toBeEnabled());
}

function chooseMember(name) {
    fireEvent.click(screen.getByRole("button", { name: /Assign to/ }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
}

describe("AssignTaskPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.listAssignableMembers.mockResolvedValue(members);
    });

    it("asks for a title, a member and a due date before assigning", async () => {
        await renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Assign task" }));

        expect(await screen.findByText("Give the task a title.")).toBeInTheDocument();
        expect(screen.getByText("Choose who owns this task.")).toBeInTheDocument();
        expect(screen.getByText("Choose a due date.")).toBeInTheDocument();
        expect(screen.getByLabelText("Task title *")).toHaveAttribute("aria-invalid", "true");
        expect(api.createTask).not.toHaveBeenCalled();
    });

    it("rejects a due date in the past", async () => {
        await renderPage();
        fireEvent.change(screen.getByLabelText("Due date *"), { target: { value: dayFromToday(-1) } });
        fireEvent.click(screen.getByRole("button", { name: "Assign task" }));
        expect(await screen.findByText("The due date can't be in the past.")).toBeInTheDocument();
    });

    it("picks a member from the dialog and shows their team", async () => {
        await renderPage();
        chooseMember("Minh Tran");

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Assign to/ })).toHaveTextContent("Minh Tran");
        expect(screen.getByText("Event Organizing")).toBeInTheDocument();
    });

    it("closes the member dialog with Escape or Cancel without choosing", async () => {
        await renderPage();
        const field = screen.getByRole("button", { name: /Assign to/ });

        fireEvent.click(field);
        expect(screen.getByRole("dialog", { name: "Assign to a member" })).toBeInTheDocument();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        fireEvent.click(field);
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(field).toHaveTextContent("Choose a member");
    });

    it("assigns the task and returns to the list with it highlighted", async () => {
        api.createTask.mockResolvedValue({ taskId: 42 });
        await renderPage();

        fireEvent.change(screen.getByLabelText("Task title *"), { target: { value: "  Prepare volunteer briefing " } });
        fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Roles and arrival times" } });
        chooseMember("Linh Nguyen");
        const due = dayFromToday(2);
        fireEvent.change(screen.getByLabelText("Due date *"), { target: { value: due } });
        fireEvent.click(screen.getByLabelText("High"));
        fireEvent.click(screen.getByRole("button", { name: "Assign task" }));

        await waitFor(() =>
            expect(navigate).toHaveBeenCalledWith("/officer/todo-list", { state: { assignedTaskId: 42 } }),
        );
        expect(api.createTask).toHaveBeenCalledWith({
            title: "Prepare volunteer briefing",
            description: "Roles and arrival times",
            assigneeId: 1,
            dueDate: due,
            priority: "HIGH",
        });
    });

    it("shows a save error and lets the user try again", async () => {
        api.createTask.mockRejectedValue(new Error("Could not save"));
        await renderPage();
        fireEvent.change(screen.getByLabelText("Task title *"), { target: { value: "Task" } });
        chooseMember("Linh Nguyen");
        fireEvent.change(screen.getByLabelText("Due date *"), { target: { value: dayFromToday(0) } });
        fireEvent.click(screen.getByRole("button", { name: "Assign task" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
        expect(screen.getByRole("button", { name: "Assign task" })).toBeEnabled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("goes back to the list on Cancel", async () => {
        await renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(navigate).toHaveBeenCalledWith("/officer/todo-list");
    });
});
