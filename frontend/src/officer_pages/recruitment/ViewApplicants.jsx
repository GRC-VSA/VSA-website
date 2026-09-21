import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Commented out because no longer directly fetch API with these
// import { getApplicationOverview, getApplicationRoles, getCompletedApplications } from "../../api/Application.js";

// We use context with cache. Faster.
import { useRecruitmentApplicants } from "../../context/RecruitmentApplicantsContext.jsx";
import "./ViewApplicants.css";

const ViewApplicants = () => {
    const navigate = useNavigate();
    // const [overview, setOverview] = useState({
    //     totalApplicants: 0,
    //     averageApplicationSeconds: 0
    // });

    // const [applications, setApplications] = useState([]);

    // const [roles, setRoles] = useState([]);

    const [selectedRoleId, setSelectedRoleId] = useState("all");

    const [error, setError] = useState("");
    const {
        overview,
        applications,
        roles,

        hasLoadedApplicants,
        loadApplicantsData,

        prefetchApplicationReviews
    } = useRecruitmentApplicants();

    useEffect(() => {
        loadApplicantsData().catch(err => {
            setError(err.message || "Failed to load applications.");
        });
    }, [loadApplicantsData]);


    const filteredApplications = useMemo(() => {
        if (selectedRoleId === "all") {
            return applications;
        }
        return applications.filter(application => Number(application.applicationRoleId) === Number(selectedRoleId));
    }, [applications, selectedRoleId]);

    useEffect(() => {
        if (filteredApplications.length === 0) {
            return;
        }
        const firstTwoApplicationIds = filteredApplications.slice(0, 2).map(
            application => application.applicationId
        );

        prefetchApplicationReviews(firstTwoApplicationIds);
    }, [filteredApplications, prefetchApplicationReviews]);
    const handleApplicationClick = (applicationId) => {
        navigate(`/officer/recruitment/applicants/${applicationId}`);
    }

    if (!hasLoadedApplicants) {
        return (
            <main className="view-applicants-page">
                {error ? (
                    <div className="applicants-error">
                        {error}
                    </div>
                ) : (
                    <p>Loading applications...</p>
                )}
            </main>
        );
    }

    return (
        <main className="view-applicants-page">

            <header className="applicants-page-header">
                <span className="applicants-eyebrow">RECRUITMENT</span>
                <h1>Applicants</h1>
            </header>

            {error && (
                <div className="applicants-error">{error}</div>
            )}

            <section className="applicants-overview">

                <div className="applicants-overview-decoration applicants-overview-decoration-top" />
                <div className="applicants-overview-decoration applicants-overview-decoration-bottom" />

                <h2>Overview</h2>

                <div className="applicants-overview-grid">
                    <div className="applicants-stat-card">
                        <span>Total applicants</span>
                        <strong>
                            {overview.totalApplicants}
                        </strong>
                    </div>

                    <div className="applicants-stat-card">
                        <span>Average Apply Time</span>
                        <strong>
                            {formatApplicationDuration(overview.averageApplicationSeconds)}
                        </strong>
                    </div>
                </div>

            </section>

            <section className="all-applications-card">
                <div className="all-applications-header">
                    <div>
                        <span className="applicants-eyebrow">ALL APPLICATIONS</span>
                        <h2>Choose an Officer role</h2>
                    </div>

                    <select
                        className="application-role-filter"
                        value={selectedRoleId}
                        onChange={event => setSelectedRoleId(event.target.value)}
                    >

                        <option value="all">All roles</option>
                        {roles.map(role => (
                            <option key={role.applicationRoleId} value={role.applicationRoleId}>
                                {role.name}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="applications-divider" />

                <div className="applications-table-wrapper">

                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>
                                    #
                                </th>

                                <th>
                                    First Name
                                </th>

                                <th>
                                    Last name
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role Applied
                                </th>

                                <th>
                                    Submitted at
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {
                                filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="applications-empty">
                                            No submitted applications for this role.
                                        </td>
                                    </tr>
                                ) : filteredApplications.map(
                                    (application, index) => (
                                        <tr
                                            key={application.applicationId}
                                            className="application-row"
                                            tabIndex="0"
                                            onClick={() => handleApplicationClick(application.applicationId)}
                                            onMouseEnter={() => {
                                                const nextApplication = filteredApplications[index + 1];
                                                prefetchApplicationReviews([
                                                    application.applicationId,
                                                    nextApplication?.applicationId
                                                ]);
                                            }}

                                            onFocus={() => {
                                                const nextApplication = filteredApplications[index + 1];
                                                prefetchApplicationReviews([
                                                    application.applicationId,
                                                    nextApplication?.applicationId
                                                ]);
                                            }}
                                            onKeyDown={
                                                event => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        handleApplicationClick(application.applicationId);
                                                    }
                                                }
                                            }
                                        >

                                            <td>{index + 1}</td>
                                            <td>{application.firstName}</td>
                                            <td>{application.lastName}</td>
                                            <td>{application.email}</td>
                                            <td>{application.roleName}</td>
                                            <td>{formatSubmittedAt(application.submittedAt)}</td>
                                        </tr>
                                    )
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};


const formatApplicationDuration = (totalSeconds) => {

    const seconds = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return (
            `${hours}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(remainingSeconds).padStart(2, "0")}`
        );
    }

    return (
        `${minutes}:` +
        `${String(remainingSeconds).padStart(2, "0")}`
    );
}


const formatSubmittedAt = (submittedAt) => {
    if (!submittedAt) {
        return "—";
    }
    const date = new Date(submittedAt);


    const time = date.toLocaleTimeString("en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );


    const day = date.toLocaleDateString("en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

    return `${time} - ${day}`;
}


export default ViewApplicants;