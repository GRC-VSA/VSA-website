import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTask, listAssignableMembers } from "../../api/Tasks.js";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";
import PickerDialog from "./PickerDialog.jsx";
import { PRIORITIES, PRIORITY_LABELS, todayIso } from "./taskFormat.js";
import "./Todo.css";

const LIST_PATH = "/officer/todo-list";

/*
    Assign task: title, description, one member and a due date. The team comes from the member.
    On success, goes back to the list with { assignedTaskId } so the new row is highlighted.
*/
export default function AssignTaskPage() {
    useDocumentTitle("Assign task");
    const navigate = useNavigate();
    const [members, setMembers] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assigneeId, setAssigneeId] = useState(null);
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [pickingMember, setPickingMember] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let ignore = false;
        listAssignableMembers()
            .then((data) => !ignore && setMembers(data))
            .catch((err) => !ignore && setSubmitError(err.message));
        return () => {
            ignore = true;
        };
    }, []);

    const today = todayIso();
    const assignee = members?.find((m) => m.userId === assigneeId) ?? null;
    const closePicker = useCallback(() => setPickingMember(false), []);

    function validate() {
        const next = {};
        if (!title.trim()) next.title = "Give the task a title.";
        if (!assignee) next.assignee = "Choose who owns this task.";
        if (!dueDate) next.dueDate = "Choose a due date.";
        else if (dueDate < today) next.dueDate = "The due date can't be in the past.";
        return next;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSubmitting(true);
        setSubmitError("");
        try {
            const task = await createTask({
                title: title.trim(),
                description: description.trim(),
                assigneeId,
                dueDate,
                priority,
            });
            navigate(LIST_PATH, { state: { assignedTaskId: task.taskId } });
        } catch (err) {
            setSubmitError(err.message);
            setSubmitting(false);
        }
    }

    return (
        <div className="td-page">
            <button type="button" className="td-btn td-btn--outline td-back" onClick={() => navigate(LIST_PATH)}>
                ←&nbsp;&nbsp;Team tasks
            </button>
            <h1 className="td-title">Assign task</h1>
            <p className="td-subtitle">Give a member a clear next step and a date to work toward.</p>

            <div className="td-columns">
                <form className="td-card td-form" onSubmit={handleSubmit} noValidate>
                    <h2 className="td-card-title">Task information</h2>

                    {submitError && <div className="td-error" role="alert">{submitError}</div>}

                    <div className="td-field">
                        <label htmlFor="td-task-title">Task title *</label>
                        <input
                            id="td-task-title"
                            className="td-input"
                            value={title}
                            maxLength={120}
                            onChange={(e) => setTitle(e.target.value)}
                            aria-invalid={Boolean(errors.title)}
                            aria-describedby={errors.title ? "td-task-title-error" : undefined}
                        />
                        <FieldError id="td-task-title-error" message={errors.title} />
                    </div>

                    <div className="td-field">
                        <label htmlFor="td-task-description">Description</label>
                        <textarea
                            id="td-task-description"
                            className="td-input td-textarea"
                            value={description}
                            maxLength={1000}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="td-field-row">
                        <div className="td-field">
                            <span className="td-label" id="td-assignee-label">Assign to *</span>
                            <button
                                type="button"
                                className={`td-input td-select${assignee ? "" : " is-placeholder"}`}
                                aria-labelledby="td-assignee-label td-assignee-value"
                                aria-haspopup="dialog"
                                aria-invalid={Boolean(errors.assignee)}
                                aria-describedby={errors.assignee ? "td-assignee-error" : undefined}
                                disabled={members === null}
                                onClick={() => setPickingMember(true)}
                            >
                                <span id="td-assignee-value">{assignee ? assignee.name : "Choose a member"}</span>
                                <span className="td-select-chevron" aria-hidden="true">⌄</span>
                            </button>
                            <FieldError id="td-assignee-error" message={errors.assignee} />
                        </div>

                        <div className="td-field">
                            <label htmlFor="td-due-date">Due date *</label>
                            <input
                                id="td-due-date"
                                type="date"
                                className="td-input"
                                value={dueDate}
                                min={today}
                                onChange={(e) => setDueDate(e.target.value)}
                                aria-invalid={Boolean(errors.dueDate)}
                                aria-describedby={errors.dueDate ? "td-due-date-error" : undefined}
                            />
                            <FieldError id="td-due-date-error" message={errors.dueDate} />
                        </div>
                    </div>

                    <div className="td-field-row">
                        <div className="td-field">
                            <span className="td-label">Team</span>
                            <p className={`td-static-value${assignee ? "" : " is-placeholder"}`}>
                                {assignee ? assignee.team ?? "No team yet" : "Set by the member you choose"}
                            </p>
                        </div>

                        <fieldset className="td-field">
                            <legend className="td-label">Priority</legend>
                            <div className="td-priority-options">
                                {PRIORITIES.map((value) => (
                                    <label key={value} className={`td-priority-option td-priority-option--${value.toLowerCase()}`}>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={value}
                                            checked={priority === value}
                                            onChange={() => setPriority(value)}
                                        />
                                        {PRIORITY_LABELS[value]}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    <div className="td-form-actions">
                        <button type="button" className="td-btn td-btn--outline td-btn--cancel" onClick={() => navigate(LIST_PATH)}>
                            Cancel
                        </button>
                        <button type="submit" className="td-btn td-btn--primary td-btn--submit" disabled={submitting}>
                            {submitting ? "Assigning…" : "Assign task"}
                        </button>
                    </div>
                </form>

                <aside className="td-card td-side-card" aria-labelledby="td-handoff-title">
                    <h2 className="td-card-title" id="td-handoff-title">A clear handoff</h2>
                    <div className="td-side-item">
                        <p className="td-side-item-title">1. One accountable member</p>
                        <p className="td-side-item-text">Choose who owns the next step.</p>
                    </div>
                    <div className="td-side-item">
                        <p className="td-side-item-title">2. A concrete due date</p>
                        <p className="td-side-item-text">Make the deadline easy to find.</p>
                    </div>
                    <p className="td-side-note">New tasks start with the status “To do”.</p>
                </aside>
            </div>

            {pickingMember && (
                <PickerDialog
                    title="Assign to a member"
                    subtitle="Choose who owns the next step."
                    options={(members ?? []).map((m) => ({ value: m.userId, label: m.name }))}
                    emptyMessage="No members to assign yet."
                    onClose={closePicker}
                    onSelect={(userId) => {
                        setAssigneeId(userId);
                        setErrors((prev) => ({ ...prev, assignee: undefined }));
                        setPickingMember(false);
                    }}
                />
            )}
        </div>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;
    return <p className="td-field-error" id={id}>{message}</p>;
}
