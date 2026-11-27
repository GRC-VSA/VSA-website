import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTask } from "../../api/Tasks.js";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";
import { PRIORITY_LABELS, STATUS_LABELS, dueState, formatDate, formatInstantDate, statusClass } from "./taskFormat.js";
import "./Todo.css";

const LIST_PATH = "/officer/todo-list";

/** One task: who owns it, when it's due, the full description, and its activity. */
export default function TaskDetailPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    // Tagged with the id it was loaded for, so moving to another task shows "Loading…" again.
    const [loaded, setLoaded] = useState({ taskId: null, task: null, error: "" });
    const current = loaded.taskId === taskId;
    const task = current ? loaded.task : null;
    const error = current ? loaded.error : "";
    useDocumentTitle(task ? task.title : "Task details");

    useEffect(() => {
        let ignore = false;
        getTask(taskId)
            .then((data) => !ignore && setLoaded({ taskId, task: data, error: "" }))
            .catch((err) => !ignore && setLoaded({ taskId, task: null, error: err.message }));
        return () => {
            ignore = true;
        };
    }, [taskId]);

    const backToList = () => navigate(LIST_PATH);
    const due = task ? dueState(task) : null;
    const assignedBy = task && [task.assignedByMe ? "Assigned by you" : task.assignedByName && `Assigned by ${task.assignedByName}`, task.assignedByRole]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className="td-page">
            <button type="button" className="td-btn td-btn--outline td-back" onClick={backToList}>
                ←&nbsp;&nbsp;Team tasks
            </button>
            <h1 className="td-title">Task details</h1>
            <p className="td-subtitle">View ownership, the deadline, and the full assignment.</p>

            {error && <div className="td-error" role="alert">{error}</div>}
            {!task && !error && <p className="td-loading">Loading…</p>}

            {task && (
                <div className="td-columns">
                    <article className="td-card td-detail">
                        <p className="td-detail-team">{task.team}</p>
                        <h2 className="td-detail-title">{task.title}</h2>
                        <div className="td-detail-tags">
                            <span className={`td-tag ${statusClass(task.status)}`}>{STATUS_LABELS[task.status]}</span>
                            <span className={`td-tag td-tag--priority${task.priority === "HIGH" ? " is-high" : ""}`}>
                                {PRIORITY_LABELS[task.priority]} priority
                            </span>
                        </div>

                        <h3 className="td-label td-detail-label">Description</h3>
                        <p className="td-detail-description">{task.description || "No description."}</p>

                        <dl className="td-detail-facts">
                            <div>
                                <dt className="td-label">Assigned to</dt>
                                <dd>{task.assignee.name}</dd>
                            </div>
                            <div>
                                <dt className="td-label">Due date</dt>
                                <dd className={due === "overdue" ? "is-urgent" : ""}>
                                    {formatDate(task.dueDate)}
                                    {due === "overdue" && <span className="td-detail-due-flag">Overdue</span>}
                                    {due === "today" && <span className="td-detail-due-flag">Today</span>}
                                </dd>
                            </div>
                        </dl>

                        {assignedBy && <p className="td-detail-assigned-by">{assignedBy}</p>}

                        <div className="td-form-actions">
                            <button type="button" className="td-btn td-btn--primary td-btn--back-list" onClick={backToList}>
                                Back to team tasks
                            </button>
                        </div>
                    </article>

                    <aside className="td-card td-side-card" aria-labelledby="td-activity-title">
                        <h2 className="td-card-title" id="td-activity-title">Activity</h2>
                        <p className="td-side-item-title td-activity-event">Task assigned</p>
                        <p className="td-side-item-text">{formatInstantDate(task.createdAt)}</p>
                        <p className="td-activity-text">Ownership and due date are set.</p>
                        <p className="td-activity-text">Status: {STATUS_LABELS[task.status]}</p>
                    </aside>
                </div>
            )}
        </div>
    );
}
