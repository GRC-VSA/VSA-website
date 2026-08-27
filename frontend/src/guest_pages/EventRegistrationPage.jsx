import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRegistrationForm, submitRegistration } from "../api/Registration.js";
import "./EventRegistrationPage.css";
const EventRegistrationPage = () => {
    const { eventId } = useParams();

    const [formData, setFormData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const updateAnswer = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value
        }));
    };

    const toggleMultipleChoiceAnswer = (questionId, optionId) => {
        setAnswers((prev) => {
            const currentAnswers = prev[questionId] ?? [];

            const alreadySelected = currentAnswers.includes(optionId);

            const newAnswers = alreadySelected
                ? currentAnswers.filter((id) => id !== optionId)
                : [...currentAnswers, optionId];

            return {
                ...prev,
                [questionId]: newAnswers
            };
        });
    };

    const renderQuestionInput = (question) => {
        const value = answers[question.questionId] ?? "";

        switch (question.typeName) {
            case "short_text":
                return (
                    <input
                        type="text"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "long_text":
                return (
                    <textarea
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "email":
                return (
                    <input
                        type="email"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "phone":
                return (
                    <input
                        type="tel"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "number":
                return (
                    <input
                        type="number"
                        value={value}
                        required={question.required}
                        onChange={(event) =>
                            updateAnswer(question.questionId, event.target.value)
                        }
                    />
                );

            case "date":
                return (
                    <input
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
                        type="url"
                        value={value}
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

        try {
            setIsLoading(true);

            const payload = buildRegistrationPayload();

            console.log("Submitting registration:", payload);

            await submitRegistration(eventId, payload);

            alert("Registration submitted successfully!");
        } catch (err) {
            console.error("Failed to submit registration:", err);
            alert("Failed to submit registration.");
        } finally {
            setIsLoading(false);
        }
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
        <main className="event-registration-page">
            <h1>{formData.eventName}</h1>
            <p>{formData.title}</p>

            <form onSubmit={handleSubmit}>
                {formData.questions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((question) => (
                        <div
                            key={question.questionId}
                            className="registration-question-div"
                        >
                            <label>
                                {question.questionText}

                                {question.required && (
                                    <span className="required-text"> Required</span>
                                )}
                            </label>

                            {renderQuestionInput(question)}
                        </div>
                    ))}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Registration"}
                </button>
            </form>
        </main>
    );
};

export default EventRegistrationPage;