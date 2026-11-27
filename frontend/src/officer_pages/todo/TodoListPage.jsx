import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { listTasks } from "../../api/Tasks.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    dueState,
    formatDate,
    sortTasks,
    statusClass,
    summarize,
    todayIso,
} from "./taskFormat.js";
import "./Todo.css";

const ROLE_VIEW_LABELS = {
    president: "President view",
    officer: "Executive officer view",
};

/*
    Team tasks: summary cards, then every task with open ones by due date and completed ones last.
    After a task is assigned, AssignTaskPage comes back here with { assignedTaskId } in the router
    state: that row is highlighted and the header button opens it.
*/
export default function TodoListPage() {
    useDocumentTitle("To do list");
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;
        listTasks()
            .then((data) => !ignore && setTasks(data))
            .catch((err) => !ignore && setError(err.message));
        return () => {
            ignore = true;
        };
    }, []);

    const today = todayIso();
    const sorted = tasks ? sortTasks(tasks) : [];
    const counts = summarize(sorted, today);
    const assignedTaskId = location.state?.assignedTaskId;
    const justAssigned = sorted.find((t) => t.taskId === assignedTaskId);
    const viewLabel = ROLE_VIEW_LABELS[auth?.user?.role];

    const openTask = (taskId) => navigate(`/officer/todo-list/${taskId}`);
    const assignTask = () => navigate("/officer/todo-list/assign");

    return (
        <div className="td-page">
            <header className="td-list-header">
                <div>
                    <p className="td-breadcrumb">Workspace / Team management</p>
                    <h1 className="td-title">To do list</h1>
                    <p className="td-subtitle">Assign work, keep due dates visible, and help your team move forward.</p>
                </div>
                <div className="td-list-header-actions">
                    {viewLabel && <p className="td-view-label">{viewLabel}</p>}
                    {justAssigned ? (
                        <button type="button" className="td-btn td-btn--primary td-btn--wide" onClick={() => openTask(justAssigned.taskId)}>
                            View task
                        </button>
                    ) : (
                        <button type="button" className="td-btn td-btn--primary td-btn--wide" onClick={assignTask}>
                            +&nbsp;&nbsp;Assign task
                        </button>
                    )}
                </div>
            </header>

            {error && <div className="td-error" role="alert">{error}</div>}

            {tasks && (
                <section className="td-summary" aria-label="Task summary">
                    <SummaryCard label="Open tasks" value={counts.open} caption="Across all teams" />
                    <SummaryCard label="Due in 7 days" value={counts.dueSoon} caption="Keep upcoming work on track" />
                    <SummaryCard label="Overdue" value={counts.overdue} caption="Needs a follow-up" urgent={counts.overdue > 0} />
                </section>
            )}

            <section aria-labelledby="td-team-tasks">
                <h2 className="td-section-title" id="td-team-tasks">Team tasks</h2>
                {tasks && (
                    <p className="td-section-sub">
                        All teams · {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · Active tasks by due date · Completed last
                    </p>
                )}

                {tasks === null && !error && <p className="td-loading">Loading…</p>}

                {tasks && tasks.length === 0 && (
                    <div className="td-card td-empty">
                        <h3>No tasks yet</h3>
                        <p>Assign the first task to give someone a clear next step.</p>
                        <button type="button" className="td-btn td-btn--primary" onClick={assignTask}>
                            +&nbsp;&nbsp;Assign task
                        </button>
                    </div>
                )}

                {tasks && tasks.length > 0 && (
                    <div className="td-table-card">
                        <table className="td-table">
                            <colgroup>
                                <col className="td-col-task" />
                                <col className="td-col-assignee" />
                                <col className="td-col-due" />
                                <col className="td-col-priority" />
                                <col className="td-col-status" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th scope="col">Task / Team</th>
                                    <th scope="col">Assigned to</th>
                                    <th scope="col">Due date</th>
                                    <th scope="col">Priority</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((task) => (
                                    <TaskRow
                                        key={task.taskId}
                                        task={task}
                                        today={today}
                                        highlighted={task.taskId === assignedTaskId}
                                        onOpen={() => openTask(task.taskId)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {justAssigned && (
                <div className="td-success" role="status">
                    Task assigned. Select the highlighted task to view details.
                </div>
            )}

            <p className="td-footnote">
                Only team leads and executive officers can assign tasks. Members can view and update their own tasks.
            </p>
        </div>
    );
}

function SummaryCard({ label, value, caption, urgent = false }) {
    return (
        <div className="td-summary-card">
            <p className="td-summary-label">{label}</p>
            <div className="td-summary-body">
                <span className={`td-summary-value${urgent ? " is-urgent" : ""}`}>{value}</span>
                <span className="td-summary-caption">{caption}</span>
            </div>
        </div>
    );
}

/** The whole row opens the task on click; the title is the real link for keyboard and screen readers. */
function TaskRow({ task, today, highlighted, onOpen }) {
    const due = dueState(task, today);

    return (
        <tr className={`td-row${highlighted ? " is-highlighted" : ""}`} onClick={onOpen}>
            <td>
                <Link
                    to={`/officer/todo-list/${task.taskId}`}
                    className="td-row-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    {task.title}
                </Link>
                <span className="td-row-team">{task.team}</span>
            </td>
            <td className="td-row-assignee">{task.assignee.name}</td>
            <td>
                <span className={`td-row-date${due === "overdue" ? " is-urgent" : ""}`}>{formatDate(task.dueDate)}</span>
                {due === "overdue" && <span className="td-row-due-flag">Overdue</span>}
                {due === "today" && <span className="td-row-due-flag">Today</span>}
            </td>
            <td>
                <span className={`td-priority${task.priority === "HIGH" ? " is-high" : ""}`}>
                    {PRIORITY_LABELS[task.priority]}
                </span>
            </td>
            <td>
                <span className={`td-status ${statusClass(task.status)}`}>{STATUS_LABELS[task.status]}</span>
            </td>
        </tr>
    );
}
