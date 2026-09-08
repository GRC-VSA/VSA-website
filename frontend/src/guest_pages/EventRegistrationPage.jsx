import { useEffect, useState } from "react";
import { useParams, useBlocker, useNavigate } from "react-router-dom";
import { getRegistrationForm, submitRegistration } from "../api/Registration.js";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import registrationBackground from "../assets/guest/event-registration-background-img.png"
import "./EventRegistrationPage.css";

const EventRegistrationPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [error, setError] = useState(null);
    const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [missingRequiredQuestionIds, setMissingRequiredQuestionIds] = useState([]);
    const [verificationResult, setVerificationResult] = useState(null);

    useDocumentTitle(formData?.eventName ? `${formData.eventName} Registration` : "Event Registration");

    useEffect(() => {
        const fetchForm = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const data = await getRegistrationForm(eventId);
                setFormData(data);
            } catch (err) {
                console.error("Failed to load registration form:", err);
                setError("Failed to load registration form.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchForm();
    }, [eventId]);
    useEffect(() => {
        if (!isSubmitted || !verificationResult) {
            return;
        }

        navigate(`/events/${eventId}/registration/verify/${verificationResult.verificationId}`,
            {
                state: {
                    email: verificationResult.email,
                    expiresAt: verificationResult.expiresAt
                }
            }
        );
    }, [isSubmitted, verificationResult, eventId, navigate]);

    const updateAnswer = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value
        }));

        if (String(value ?? "").trim() !== "") {
            clearQuestionError(questionId);
        }
    };

    const toggleMultipleChoiceAnswer = (questionId, optionId) => {
        setAnswers((prev) => {
            const currentAnswers = prev[questionId] ?? [];

            const alreadySelected = currentAnswers.includes(optionId);

            const newAnswers = alreadySelected
                ? currentAnswers.filter((id) => id !== optionId)
                : [...currentAnswers, optionId];

            if (newAnswers.length > 0) {
                clearQuestionError(questionId);
            }
            return {
                ...prev,
                [questionId]: newAnswers
            };
        });
    };

    const hasUnsavedAnswers = Object.values(answers).some((answer) => {
        if (Array.isArray(answer))
            return answer.length > 0;

        return String(answer ?? "").trim() !== "";
    });

    const blocker = useBlocker(hasUnsavedAnswers && !isSubmitted && !isSubmittingRegistration);

    const isQuestionAnswered = (question) => {
        const answer = answers[question.questionId];

        if (question.typeName === "multiple_choice") {
            return Array.isArray(answer) && answer.length > 0;
        }

        if (question.typeName === "single_choice") {
            return answer !== undefined && answer !== null && answer !== "";
        }

        return String(answer ?? "").trim() !== "";
    };

    const clearQuestionError = (questionId) => {
        setMissingRequiredQuestionIds((prev) => prev.filter((id) => id !== questionId));
    };

    /*
    This button is not currently used
    */
    const renderToTheWebsiteButton = () => {
        const handleReturnToWebsite = () => {
            if (window.history.length > 1) {
                navigate(-1);
            }
            else {
                navigate("/");
            }
        };
        return (
            <button type="button" id="to-website-button" onClick={() => handleReturnToWebsite()}>
                <span className="to-website-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z" /></svg>                </span>
                <span className="to-website-text">
                    Return To VSA Website
                </span>
            </button>
        );
    }
    const renderQuestionInput = (question, inputId) => {
        const value = answers[question.questionId] ?? "";

        switch (question.typeName) {
            case "short_text":
                return (
                    <input
                        id={inputId}
                        type="text"
                        value={value}
                        required={question.required}
                        placeholder="Enter your answer"
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "long_text":
                return (
                    <textarea
                        id={inputId}
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                        placeholder="Enter your answer"
                    />
                );

            case "email":
                return (
                    <input
                        id={inputId}
                        type="email"
                        value={value}
                        placeholder="Enter an email address"
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "phone":
                return (
                    <input
                        id={inputId}
                        type="tel"
                        value={value}
                        placeholder="Enter your phone number"
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "number":
                return (
                    <input
                        id={inputId}
                        type="number"
                        value={value}
                        placeholder="Enter a number"
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "date":
                return (
                    <input
                        id={inputId}
                        type="date"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "url":
                return (
                    <input
                        id={inputId}
                        type="url"
                        value={value}
                        placeholder="Enter a URL"
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "single_choice":
                return (
                    <div className="choice-answer-div">
                        {question.options.map((option) => (
                            <label key={option.optionId}>
                                <input
                                    type="radio"
                                    name={`question-${question.questionId}`}
                                    value={option.optionId}
                                    required={question.required}
                                    checked={answers[question.questionId] === option.optionId}
                                    onChange={() =>
                                        updateAnswer(question.questionId, option.optionId)
                                    }
                                />
                                {option.optionText}
                            </label>
                        ))}
                    </div>
                );

            case "multiple_choice":
                return (
                    <div className="choice-answer-div">
                        {question.options.map((option) => {
                            const selectedOptions = answers[question.questionId] ?? [];

                            return (
                                <label key={option.optionId}>
                                    <input
                                        type="checkbox"
                                        value={option.optionId}
                                        checked={selectedOptions.includes(option.optionId)}
                                        onChange={() =>
                                            toggleMultipleChoiceAnswer(
                                                question.questionId,
                                                option.optionId
                                            )
                                        }
                                    />
                                    {option.optionText}
                                </label>
                            );
                        })}
                    </div>
                );

            default:
                return (
                    <input
                        id={inputId}
                        type="text"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );
        }
    };

    const buildRegistrationPayload = () => {
        return {
            answers: formData.questions.map((question) => {
                const answer = answers[question.questionId];

                if (question.typeName === "single_choice") {
                    return {
                        questionId: question.questionId,
                        selectedOptionIds: answer ? [answer] : [],
                        answerValue: ""
                    };
                }

                if (question.typeName === "multiple_choice") {
                    return {
                        questionId: question.questionId,
                        selectedOptionIds: answer ?? [],
                        answerValue: ""
                    };
                }

                return {
                    questionId: question.questionId,
                    selectedOptionIds: [],
                    answerValue: answer ?? ""
                };
            })
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const missingQuestions = formData.questions.filter((question) => question.required && !isQuestionAnswered(question));

        if (missingQuestions.length > 0) {
            setMissingRequiredQuestionIds(missingQuestions.map((question) => question.questionId));
            return;
        }

        setMissingRequiredQuestionIds([]);
        setSubmitError("");
        setIsSubmittingRegistration(true);

        try {
            setIsLoading(true);

            const payload = buildRegistrationPayload();
            const result = await submitRegistration(eventId, payload);
            setIsSubmitted(true);
            setVerificationResult(result);
        } catch (err) {
            setIsSubmittingRegistration(false);
            console.error("Failed to submit registration:", err);
            if (err.message === "This student email is already registered for this event.") {
                setSubmitError("You already registered for this event!");
            } else {
                alert("An error occured when submitting the registration form. Please try again!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const convert24hTo12h = (time) => {
        let period = "";
        if (!time) {
            return "";
        }
        else {
            const [hours, minutes] = time.split(":");
            if (+hours >= 12) {
                period = "PM";
            }
            else {
                period = "AM";
            }
            const newHour = +hours % 12 || 12;
            return `${newHour}:${minutes} ${period}`;
        }
    }

    const formatDateWithOrdinal = (dateString) => {
        const date = new Date(`${dateString}T00:00:00`);

        const weekday = date.toLocaleString("en-US", { weekday: "long" });
        const month = date.toLocaleString("en-US", { month: "long" });
        const day = date.getDate();
        const year = date.getFullYear();

        const getOrdinal = (number) => {
            if (number >= 11 && number <= 13) {
                return "th";
            }

            switch (number % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };

        return `${weekday} - ${month} ${day}${getOrdinal(day)}, ${year}`;
    };

    if (isLoading && !formData) {
        return <main>Loading registration form...</main>;
    }

    if (error) {
        return <main>{error}</main>;
    }

    if (!formData) {
        return <main>No registration form found.</main>;
    }

    return (
        <>
            <main className="event-registration-page" style={{ backgroundImage: `url(${registrationBackground})` }}>
                <div className="registration-form-div">
                    <div className="registration-form-header">
                        <div className="watermark">
                            <p>Vietnamese Student Association</p>
                        </div>
                        <div className="horizontal-div"></div>
                        <div className="event-info">
                            <h1>{formData.eventName}</h1>
                            <div className="event-detail-div">
                                <div className="event-detail-title">

                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" /></svg>
                                    <strong>Date:</strong>
                                </div>
                                <span id="event-date">{formatDateWithOrdinal(formData.eventDate)}</span>
                            </div>
                            <div className="event-detail-div">
                                <div className="event-detail-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800t140.5 28.5q65.5 28.5 114 77t77 114Q840-515 840-440t-28.5 140.5q-28.5 65.5-77 114t-114 77Q555-80 480-80t-140.5-28.5ZM480-440Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" /></svg>
                                    <strong>Time:</strong>
                                </div>
                                <span>{convert24hTo12h(formData.startTime.slice(0, 5))} - {convert24hTo12h(formData.endTime.slice(0, 5))}</span>
                            </div>
                            <div className="event-detail-div">
                                <div className="event-detail-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" /></svg>
                                    <strong>Location: </strong>
                                </div>
                                <span>{formData.location}</span>
                            </div>

                        </div>
                    </div>
                    <form className="registration-form-body" onSubmit={handleSubmit} noValidate>
                        {[...formData.questions]
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((question, index) => {
                                const inputId = `registration-question-${question.questionId}`;

                                const isChoiceQuestion = question.typeName === "single_choice" || question.typeName === "multiple_choice";

                                const questionLabel = (
                                    <>
                                        <span className="question-number">{index + 1}. </span>
                                        <span className="question-text">{question.questionText}</span>

                                        {question.required && (
                                            <span className="required-text"> *Required</span>
                                        )}
                                    </>
                                );

                                return (
                                    <div
                                        key={question.questionId}
                                        className={`registration-question-div ${missingRequiredQuestionIds.includes(question.questionId)
                                            ? "question-has-error"
                                            : ""
                                            }`}
                                    >
                                        {isChoiceQuestion ? (
                                            <fieldset>
                                                <legend>
                                                    {questionLabel}
                                                </legend>

                                                {renderQuestionInput(question, inputId)}
                                            </fieldset>
                                        ) : (
                                            <>
                                                <label htmlFor={inputId}>
                                                    {questionLabel}
                                                </label>

                                                <br />

                                                {renderQuestionInput(question, inputId)}
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        }
                        {missingRequiredQuestionIds.length > 0 && (
                            <p className="required-questions-error">Some required questions are not answered!</p>
                        )}
                        {submitError && (
                            <p className="registration-submit-error">
                                {submitError}
                            </p>
                        )}
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Submit Registration"}
                        </button>
                    </form>
                </div>
            </main>
            {/* {renderToTheWebsiteButton()} */}
            {blocker.state === "blocked" && (
                <div className="leave-warning-overlay">
                    <div className="leave-warning-modal">
                        <h2>Leave registration?</h2>
                        <p>
                            You have an <span>unsaved</span> registration.
                            Your answers will be lost if you leave this page.
                        </p>
                        <div className="leave-warning-buttons">
                            <button type="button" className="stay-button" onClick={() => blocker.reset()}>
                                Stay
                            </button>

                            <button type="button" className="leave-button" onClick={() => blocker.proceed()}>
                                Yes, leave!
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default EventRegistrationPage;