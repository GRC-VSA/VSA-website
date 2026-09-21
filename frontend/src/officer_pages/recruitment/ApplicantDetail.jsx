import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {getSubmittedApplicationReview} from "../../api/Application.js";
import "./ApplicantDetail.css";

const ApplicantDetail = () => {

    const { applicationId } = useParams();

    const [application, setApplication] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    useEffect(() => {
        async function loadApplication() {
            try {
                setLoading(true);
                setError("");
                const data = await getSubmittedApplicationReview(applicationId);
                setApplication(data);
            }
            catch (err) {
                setError(err.message || "Failed to load application.");
            }
            finally {
                setLoading(false);
            }
        }
        loadApplication();
    }, [applicationId]);

    if (loading) {
        return (
            <main className="applicant-detail-page">
                <p>Loading application...</p>
            </main>
        );
    }

    if (error) {

        return (
            <main className="applicant-detail-page">
                <div className="applicant-detail-error">
                    {error}
                </div>
            </main>
        );
    }

    if (!application) {
        return null;
    }

    let questionNumber = 0;
    return (
        <main className="applicant-detail-page">

            <header className="applicant-detail-page-header">

                <span className="applicant-detail-eyebrow">
                    RECRUITMENT
                </span>

                <h1>Applicants</h1>

            </header>

            <div className="applicant-review-sections">

                {application.sections.map((section, sectionIndex) => (
                        <section key={section.sectionId} className="applicant-review-section">
                            <div className="applicant-review-section-header">
                                <span className="applicant-section-number">
                                    SECTION {sectionIndex + 1}
                                </span>

                                <h2>{section.sectionHeading}</h2>
                                {
                                    section.sectionDescription && (
                                        <p>{section.sectionDescription}</p>
                                    )
                                }
                            </div>

                            <div className="applicant-review-section-body">

                                {section.questions.map(question => 
                                    {
                                        questionNumber += 1;
                                        return (
                                            <QuestionReview key={question.questionId} number={questionNumber} question={question} />
                                        );
                                    }
                                )}

                                {
                                    sectionIndex === 0 && (
                                        <div className="applicant-role-row">

                                            <div className="applicant-role-label">
                                                Role Applying For:
                                            </div>

                                            <div className="applicant-role-value">
                                                {application.roleName}
                                            </div>

                                        </div>
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


const QuestionReview = ({number, question}) => {

    const isChoice = question.questionType === "single_choice" || question.questionType === "multiple_choice";
    return (
        <div className="applicant-question">
            <div className="applicant-question-heading">

                <span className="applicant-question-number">
                    {number}
                </span>

                <span className="applicant-question-text">
                    {question.questionText}
                </span>
                {
                    question.required && (
                        <span className="applicant-required">
                            Required
                        </span>

                    )
                }

            </div>

            {
                isChoice ? (<ChoiceAnswer question={question}/>)
                        : (<TextAnswer question={question}/>)
            }

        </div>
    );
}


const TextAnswer = ({question}) => {

    const answer = question.answerText?.trim();
    return (
        <div
            className={
                [
                    "applicant-text-answer",

                    question.questionType === "long_text" ? "applicant-text-answer-long" : "",
                    !answer ? "applicant-answer-empty" : ""
                ]
                    .filter(Boolean)
                    .join(" ")
            }
        >
            {answer || "No answer provided"}
        </div>
    );
}


const ChoiceAnswer = ({question}) => {

    const selectedOptions = question.selectedOptions || [];
    const options = question.options || [];

    const multiple = question.questionType === "multiple_choice";
    return (
        <div className="applicant-choice-answer">

            {options.map(option => {

                const selected = selectedOptions.includes(option);
                return (
                    <div key={option} className="applicant-choice-option">
                        <span className={multiple ? (selected ? "applicant-checkbox selected" : "applicant-checkbox" )
                                    : (selected ? "applicant-radio selected" : "applicant-radio")
                            }
                            aria-hidden="true"
                        />

                        <span className={selected ? "applicant-choice-text selected" : "applicant-choice-text"}>
                            {option}
                        </span>

                    </div>
                );
            })}

        </div>
    );
}


export default ApplicantDetail;