import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { getMyApplications } from "../api/Application.js";
import "./MyApplicationDetail.css";
import { useMyApplications } from "../context/MyApplicationsContext.jsx";

const MyApplicationDetail = () => {

    const navigate = useNavigate();

    const { applicationId } =
        useParams();


    // const [application, setApplication] =
    //     useState(null);

    const { reviewsById, loadApplicationReview } = useMyApplications();
    const application = reviewsById[String(applicationId)] || null;
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    useEffect(() => {

        if (application) {
            return;
        }


        loadApplicationReview(applicationId)
            .catch(error => {
                console.error(error);
                setError(error.message || "Failed to load application.");
            });

    }, [application, applicationId, loadApplicationReview]);

    if (!application && !error) {
        return (
            <main className="my-application-detail-page">
                <p>
                    Loading application...
                </p>
            </main>
        );
    }
    if (error) {

        return (

            <main className="my-application-detail-page">

                <button
                    type="button"
                    className="my-application-back-button"
                    onClick={() =>
                        navigate("/my-applications")
                    }
                >
                    ← Back to My Applications Portal
                </button>


                <p className="my-application-detail-error">
                    {error}
                </p>

            </main>

        );

    }


    if (!application) {

        return null;

    }


    return (

        <main className="my-application-detail-page page-footer-space-extra">


            <button
                type="button"
                className="my-application-back-button"
                onClick={() =>
                    navigate("/my-applications")
                }
            >
                ← Back to My Applications
            </button>


            <header className="my-application-detail-header">

                <span>
                    SUBMITTED APPLICATION
                </span>


                <h1>
                    {application.roleName}
                </h1>


            <div className="my-application-detail-status">
                {/* Application submitted successfully */}
                <p>
                    Submitted Successfully:  {formatDate(application.submittedAt)}
                </p>
            </div>

            </header>




            <div className="my-application-detail-sections">

                {application.sections.map(
                    (
                        section,
                        sectionIndex
                    ) => (

                        <section
                            key={section.sectionId}
                            className="my-application-detail-section"
                        >

                            <div className="my-application-section-header">

                                <span>
                                    Section {
                                        sectionIndex + 1
                                    }
                                </span>


                                <h2>
                                    {
                                        section.sectionHeading
                                    }
                                </h2>


                                {
                                    section.sectionDescription &&
                                    (
                                        <p>
                                            {
                                                section.sectionDescription
                                            }
                                        </p>
                                    )
                                }

                            </div>


                            <div className="my-application-question-list">

                                {
                                    section.questions.map(
                                        (
                                            question,
                                            questionIndex
                                        ) => (

                                            <div key={question.questionId} className="my-application-question">
                                                <div className="my-application-question-title">
                                                    <span>
                                                        {questionIndex + 1}.
                                                    </span>
                                                    <p>
                                                        {question.questionText}
                                                        {
                                                            question.required &&
                                                            (
                                                                <span className="my-application-required">
                                                                    *
                                                                </span>
                                                            )
                                                        }
                                                    </p>

                                                </div>


                                                <ApplicationAnswer question={question} />

                                            </div>

                                        )
                                    )
                                }

                            </div>

                        </section>

                    )
                )}

            </div>

        </main>

    );

};


// READ-ONLY ANSWER

const ApplicationAnswer = ({ question }) => {

    const isChoice =
        question.questionType === "single_choice" ||
        question.questionType === "multiple_choice";

    if (isChoice) {

        const selectedOptions = new Set(question.selectedOptions || []);

        return (
            <div className="my-application-choice-answers">

                {(question.options || []).map(
                    option => {

                        const selected = selectedOptions.has(option);
                        return (
                            <div key={option} className={`my-application-option ${selected ? "selected" : ""}`}>

                                <span className="my-application-option-marker">
                                    {
                                        question.questionType === "single_choice"
                                            ? selected
                                                ? "●"
                                                : "○"

                                            : selected
                                                ? "✓"
                                                : "□"
                                    }
                                </span>

                                <span>{option}</span>
                            </div>
                        );

                    }
                )}

            </div>

        );

    }


    return (
        <div className={`my-application-answer ${question.answerText ? "" : "empty"}`}>
            {question.answerText || "No answer"}
        </div>

    );

};

const formatDate = (dateValue) => {

    if (!dateValue) {
        return "";
    }
    return new Date(dateValue).toLocaleString("en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
};


export default MyApplicationDetail;