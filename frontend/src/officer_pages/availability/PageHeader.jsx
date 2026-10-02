// src/officer_pages/availability/PageHeader.jsx
import VSA_blacklogo from "../../assets/officer/VSA_blacklogo.png";

/** Same header as Create Events: title and one-line description on the left, logo on the right. */
export default function PageHeader({ title, subtitle, onBack, backLabel = "Back to availability", showLogo = true }) {
    return (
        <>
            {onBack && (
                <button type="button" className="av-back" onClick={onBack}>
                    ← {backLabel}
                </button>
            )}
            <header className="av-page-header">
                <div>
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {showLogo && <img src={VSA_blacklogo} alt="VSA" />}
            </header>
        </>
    );
}