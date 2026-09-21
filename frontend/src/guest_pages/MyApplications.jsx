import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import { getMyApplications } from "../api/Application.js";
import { useMyApplications } from "../context/MyApplicationsContext.jsx";
import "./MyApplicationsPage.css";


const MyApplicationsPage = () => {

    const navigate = useNavigate();

    // const [applications, setApplications] = useState([]);

    const { applications, loadMyApplications, loadApplicationReview } = useMyApplications();

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    useEffect(() => {
        if (applications !== null) {
            return;
        }
        loadMyApplications()
            .catch(error => {
                console.error(error);
                setError(error.message || "Failed to load your applications.");
            });
    }, [applications, loadMyApplications]);

    const handleResume = (
        applicationId
    ) => {

        navigate(
            `/apply?resume=${applicationId}`
        );

    };


    const handleView = (
        applicationId
    ) => {

        navigate(
            `/my-applications/${applicationId}`
        );

    };


    if (applications === null && !error) {

        return (
            <main className="my-applications-page">
                <p>
                    Loading applications...
                </p>
            </main>

        );

    }


    return (

        <main className="my-applications-page page-footer-space-extra">


            <header className="my-applications-header">

                <span>
                    OFFICER RECRUITMENT
                </span>

                <h1>
                    My Applications
                </h1>

                <p>
                    View your submitted applications or continue
                    where you left off.
                </p>

            </header>


            {error && (

                <div className="my-applications-error">

                    {error}

                </div>

            )}


            {!error && applications.length === 0 && (

                <div className="my-applications-empty">

                    <h2>
                        No applications yet
                    </h2>

                    <p>
                        You haven't started an officer application.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/apply")
                        }
                    >
                        Apply Now
                    </button>

                </div>

            )}


            {applications.length > 0 && (

                <div className="my-applications-list">

                    {applications.map(
                        application => {

                            const inProgress =
                                application.status ===
                                "IN_PROGRESS";

                            const completed =
                                application.status ===
                                "COMPLETED";


                            return (

                                <article
                                    key={
                                        application.applicationId
                                    }
                                    className="my-application-card"
                                >

                                    <div className="my-application-info">

                                        <div className="my-application-title-row">

                                            <h2>
                                                {
                                                    application.roleName
                                                }
                                            </h2>


                                            <span
                                                className={
                                                    inProgress
                                                        ? "my-application-status in-progress"
                                                        : "my-application-status completed"
                                                }
                                            >

                                                {
                                                    inProgress
                                                        ? "In Progress"
                                                        : "Completed"
                                                }

                                            </span>

                                        </div>


                                        <p className="my-application-date">

                                            {inProgress
                                                ? `Last saved: ${formatDate(
                                                    application.updatedAt
                                                )
                                                }`
                                                : `Submitted: ${formatDate(
                                                    application.submittedAt
                                                )
                                                }`
                                            }

                                        </p>

                                    </div>


                                    <div className="my-application-actions">

                                        {inProgress && (

                                            <button
                                                type="button"
                                                className="my-application-resume-button"
                                                onClick={() =>
                                                    handleResume(
                                                        application.applicationId
                                                    )
                                                }
                                            >

                                                Resume

                                            </button>

                                        )}


                                        {completed && (

                                            <button
                                                type="button"
                                                className="my-application-view-button"
                                                onMouseEnter={() => loadApplicationReview(application.applicationId).catch(() => { })}
                                                onFocus={() => loadApplicationReview(application.applicationId).catch(() => { })}
                                                onClick={() => handleView(application.applicationId)}
                                            >

                                                View Application

                                            </button>

                                        )}

                                    </div>

                                </article>

                            );

                        }
                    )}

                </div>

            )}

        </main>

    );

};


const formatDate = (
    dateValue
) => {

    if (!dateValue) {

        return "—";

    }


    const date =
        new Date(dateValue);


    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

};


export default MyApplicationsPage;