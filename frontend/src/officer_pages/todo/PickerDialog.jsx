import { useEffect, useId, useRef } from "react";

/*
    Pop-up list of choices ("Assign to a member"). Clicking the backdrop, Cancel or Escape closes
    it without choosing. Focus moves to the first choice on open and back to whatever opened the
    dialog on close.

    options: [{ value, label }]
*/
export default function PickerDialog({ title, subtitle, options, emptyMessage = "Nothing to choose from.", onSelect, onClose }) {
    const titleId = useId();
    const dialogRef = useRef(null);

    useEffect(() => {
        const opener = document.activeElement;
        dialogRef.current?.querySelector("button")?.focus();

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            opener?.focus?.();
        };
    }, [onClose]);

    return (
        <div className="td-dialog-layer">
            <div className="td-dialog-backdrop" aria-hidden="true" onClick={onClose} />
            <div className="td-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
                <h2 className="td-dialog-title" id={titleId}>{title}</h2>
                {subtitle && <p className="td-dialog-sub">{subtitle}</p>}

                {options.length === 0 ? (
                    <p className="td-dialog-empty">{emptyMessage}</p>
                ) : (
                    <ul className="td-dialog-options">
                        {options.map((option) => (
                            <li key={option.value}>
                                <button type="button" className="td-dialog-option" onClick={() => onSelect(option.value)}>
                                    <span>{option.label}</span>
                                    <span className="td-dialog-chevron" aria-hidden="true">›</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <button type="button" className="td-dialog-cancel" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
