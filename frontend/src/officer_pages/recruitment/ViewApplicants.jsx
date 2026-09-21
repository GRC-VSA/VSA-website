import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getApplicationOverview, getApplicationRoles, getCompletedApplications } from "../../api/Application.js";

import "./ViewApplicants.css";

const ViewApplicants = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState({
        totalApplicants: 0,
        averageApplicationSeconds: 0
    });

    const [applications, setApplications] = useState([]);

    const [roles, setRoles] = useState([]);

    const [selectedRoleId, setSelectedRoleId] = useState("all");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadApplicantsPage() {

            try {
                setLoading(true);
                setError("");
                const [overviewData, applicationData, roleData] = await Promise.all([
                    getApplicationOverview(),
                    getCompletedApplications(),
                    getApplicationRoles()
                ]);
                setOverview(overviewData);
                setApplications(applicationData);
                setRoles(roleData);
            }
            catch (err) {
                setError(err.message || "Failed to load applications.");
            }
            finally {
                setLoading(false);
            }
        }
        loadApplicantsPage();
    }, []);


    const filteredApplications =
        useMemo(() => {

            if (selectedRoleId === "all") {
                return applications;
            }
            return applications.filter(application => Number(application.applicationRoleId) === Number(selectedRoleId));
        }, [applications, selectedRoleId]);


    const handleApplicationClick = (applicationId) => {
        navigate(`/officer/recruitment/applicants/${applicationId}`);
    }

    if (loading) {

        return (
            <main className="view-applicants-page">
                <p>Loading applications...</p>
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