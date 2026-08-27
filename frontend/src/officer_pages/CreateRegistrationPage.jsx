import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuestionTypes } from "../context/QuestionTypesContext";
import { createQuestions } from "../api/Question";
import { getEventById } from "../api/Events";
const CreateRegistrationPage = () => {
    const { questionTypes } = useQuestionTypes();
    const { eventId } = useParams();
    const [justCreatedEvent, setJustCreatedEvent] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [questionTypeVisibility, setQuestionTypeVisibility] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setIsLoading(true);
                setJustCreatedEvent(await getEventById(eventId));
                setIsLoading(false);
            }
            catch (err) {
                console.error("Failed to fetch the newly-created event", err);
                setError("Failed to fetch the newly-created event");
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const toggleQuestionTypeVisibility = () => {
        setQuestionTypeVisibility((prev) => !prev);
    };

    const formatQuestionTypeName = (typeName) => {
        if (!typeName)
            return;
        return typeName.replace(/_/g, " ").replace(/-/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };
    //This returns one question type including its questionTypeId, typeName, inputConfig 
    const findQuestionTypeFromId = (questionTypeId) => {
        return questionTypes.find((type) => Number(questionTypeId) === Number(type.questionTypeId));
    }
    const addQuestion = (questionTypeId) => {
        const questionType = findQuestionTypeFromId(questionTypeId);
        const typeName = questionType?.typeName;
        const isAChoiceQuestion = typeName === "single_choice" || typeName === "multiple_choice";
        // isAChoiceQuestion is a boolean that confirms the question is of type "single choice" or  "multiple choice".

        setQuestions((prev) => [...prev,
        {
            questionTypeId: Number(questionTypeId),
            questionText: '',
            required: false,
            displayOrder: prev.length + 1,
            options: isAChoiceQuestion ? //if it's a choice question, 
                [ //Add two objects to the "options" array. Those objects are option 1 and option 2.
                    {
                        optionText: "Option 1",
                        displayOrder: 1
                    },
                    {
                        optionText: "Option 2",
                        displayOrder: 1
                    }
                ] : //If it's not a choice question
                [] //The option field is an empty array
        }]);
        setQuestionTypeVisibility(false);
    };

    const updateQuestion = (index, field, value) => {
        setQuestions((prev) =>
            prev.map((question, i) =>
                i === index ? { ...question, [field]: value } : question));
    };

    const removeQuestion = (index) => {
        setQuestions((prev) =>
            prev.filter((question, i) => i !== index)
                .map((question, i) => ({
                    ...question,
                    displayOrder: i + 1
                })));
    };

    const moveQuestion = (indexOld, indexNew) => {
        setQuestions((prev) => {
            const newQuestions = [...prev];
            const [movedQuestion] = newQuestions.splice(indexOld, 1);
            newQuestions.splice(indexNew, 0, movedQuestion);
            return newQuestions.map((question, i) => ({ ...question, displayOrder: i + 1 }));
        });
    };

    const addOption = (questionIndex) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex)
                    return question;
                const currentOptions = question.options ?? [];
                return {
                    ...question,
                    options: [
                        ...currentOptions,
                        {
                            optionText: `Option ${currentOptions.length + 1}`,
                            displayOrder: currentOptions.length + 1
                        }
                    ]
                };
            }));
    };
    const updateOption = (questionIndex, optionIndex, optionValue) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex)
                    return question;
                const currentOptions = question.options ?? [];
                return {
                    ...question,
                    options: currentOptions.map((op, i) => {
                        if (i !== optionIndex)
                            return op;
                        return {
                            ...op,
                            optionText: optionValue
                        };
                    })
                };
            }));
    };
    const removeOption = (questionIndex, optionIndex) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex)
                    return question;
                const currentOptions = question.options ?? [];
                return {
                    ...question,
                    options: currentOptions
                        .filter((op, i) => i !== optionIndex)
                        .map((op, i) => ({
                            ...op,
                            displayOrder: i + 1
                        }))
                };
            }));
    };

    const moveOption = (questionIndex, optionOldIndex, optionNewIndex) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex)
                    return question;
                const currentOptions = question.options ?? [];
                const tempOptions = [...currentOptions];
                const [movedOption] = tempOptions.splice(optionOldIndex, 1);
                tempOptions.splice(optionNewIndex, 0, movedOption);
                return {
                    ...question,
                    options: tempOptions.map((op, i) => ({ ...op, displayOrder: i + 1 }))
                }
            }));
    };

    const renderStudentInputPreview = (question, questionIndex) => {
        const questionType = findQuestionTypeFromId(question.questionTypeId);
        const typeName = questionType?.typeName;
        switch (typeName) {
            case "short_text":
                return (
                    <input type="text" className="student-preview-input" disabled />
                );
            case "long_text":
                return (
                    <textarea className="student-preview-textarea" disabled />
                );
            case "number":
                return (
                    <input type="number" className="student-preview-input" disabled />
                );
            case "email":
                return (
                    <input type="email" className="student-preview-input" disabled />
                );
            case "phone":
                return (
                    <input type="tel" className="student-preview-input" disabled />
                );
            case "date":
                return (
                    <input type="date" className="student-preview-input" disabled />
                );
            case "url":
                return (
                    <input type="url" className="student-preview-input" disabled />
                );
            case "single_choice":
                return (
                    <div className="choice-preview-div">
                        {
                            question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="choice-option-row">
                                    <input type="radio" disabled />
                                    <input type="text" value={option.optionText} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} className="choice-option-text-input" />
                                    <div className="delete-option-div" onClick={() => removeOption(questionIndex, optionIndex)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                    </div>
                                </div>
                            ))
                        }
                        <button type="button" onClick={() => addOption(questionIndex)}>
                            + Add Option
                        </button>
                    </div>
                );
            case "multiple_choice":
                return (
                    <div className="choice-preview-div">
                        {
                            question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="choice-option-row">
                                    <input type="checkbox" disabled />
                                    <input type="text" value={option.optionText} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} className="choice-option-text-input" />
                                    <div className="delete-option-div" onClick={() => removeOption(questionIndex, optionIndex)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                    </div>
                                </div>
                            ))
                        }
                        <button type="button" onClick={() => addOption(questionIndex)}>
                            + Add Option
                        </button>
                    </div>
                );
            default:
                return null;
        }
    }
    const renderQuestionTypeIcon = (typeName) => {
        switch (typeName) {
            case "short_text":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="question-type-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-160v-520H80v-120h520v120H400v520H280Zm360 0v-320H520v-120h360v120H760v320H640Z" /></svg>
                );

            case "long_text":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="question-type-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z" /></svg>
                );

            case "number":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="question-type-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M560-320h120v-320H560v320Zm0 120q-50 0-85-35t-35-85v-320q0-50 35-85t85-35h120q50 0 85 35t35 85v320q0 50-35 85t-85 35H560Zm-320 0v-440h-80v-120h200v560H240Z" /></svg>
                );

            case "email":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="question-type-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" /></svg>
                );

            case "phone":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="question-type-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M760-480q0-117-81.5-198.5T480-760v-80q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480h-80Zm-160 0q0-50-35-85t-85-35v-80q83 0 141.5 58.5T680-480h-80Zm198 360q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" /></svg>
                );

            case "single_choice":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M621.5-338.5Q680-397 680-480t-58.5-141.5Q563-680 480-680t-141.5 58.5Q280-563 280-480t58.5 141.5Q397-280 480-280t141.5-58.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" /></svg>
                );

            case "multiple_choice":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M183.5-183.5Q160-207 160-240t23.5-56.5Q207-320 240-320t56.5 23.5Q320-273 320-240t-23.5 56.5Q273-160 240-160t-56.5-23.5Zm240 0Q400-207 400-240t23.5-56.5Q447-320 480-320t56.5 23.5Q560-273 560-240t-23.5 56.5Q513-160 480-160t-56.5-23.5Zm240 0Q640-207 640-240t23.5-56.5Q687-320 720-320t56.5 23.5Q800-273 800-240t-23.5 56.5Q753-160 720-160t-56.5-23.5Zm-480-240Q160-447 160-480t23.5-56.5Q207-560 240-560t56.5 23.5Q320-513 320-480t-23.5 56.5Q273-400 240-400t-56.5-23.5Zm240 0Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5Zm240 0Q640-447 640-480t23.5-56.5Q687-560 720-560t56.5 23.5Q800-513 800-480t-23.5 56.5Q753-400 720-400t-56.5-23.5Zm-480-240Q160-687 160-720t23.5-56.5Q207-800 240-800t56.5 23.5Q320-753 320-720t-23.5 56.5Q273-640 240-640t-56.5-23.5Zm240 0Q400-687 400-720t23.5-56.5Q447-800 480-800t56.5 23.5Q560-753 560-720t-23.5 56.5Q513-640 480-640t-56.5-23.5Zm240 0Q640-687 640-720t23.5-56.5Q687-800 720-800t56.5 23.5Q800-753 800-720t-23.5 56.5Q753-640 720-640t-56.5-23.5Z" /></svg>
                );

            case "date":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" /></svg>
                );

            case "url":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z" /></svg>
                );

            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM480-80 373-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H587L480-80Zm0-144 64-96h256v-480H160v480h256l64 96Zm0-336Z" /></svg>
                );
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setIsLoading(true);
            await createQuestions(eventId, questions);
            alert("Successfully created registration form for the event!");
            navigate("/officer/events/manage-event");
        }
        catch (err) {
            console.error("Failed to create registration form for the event!", err);
            alert("An error occurred when creating registration form");
        }
        finally {
            setIsLoading(false);
        }
    }
    const handleEnterKey = (event) => {
        if (event.key === "Enter") {
            if (event.target.tagName === "TEXTAREA") {
                return;
            }
            else {
                event.preventDefault();
            }
        }
    }

    return (
        <main id="create-registration-page">
            <div className="header-div">
                <div className="header-content-div">
                    <h1>{justCreatedEvent?.eventName}</h1>
                    <span>Student will register for {justCreatedEvent?.eventName} through this form</span>
                </div>
            </div>
            <form className="registration-form-container" id="registration-form-container" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
                <div className="all-questions-div">
                    {
                        questions.map((question, index) => {
                            const questionType = findQuestionTypeFromId(question.questionTypeId);

                            return (
                                <div key={index} className="question-div">
                                    <div className="question-top-div">
                                        <div className="question-text-div">
                                            <span className="question-number">{index + 1}</span>
                                            <input type="text" value={question.questionText} onChange={(event) => updateQuestion(index, "questionText", event.target.value)} className="question-text-input" required />
                                            {question.required && (
                                                <span className="red-required-text">Required</span>
                                            )}
                                        </div>
                                        <div className="question-button-div">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm-56.5-263.5Q120-687 120-720t23.5-56.5Q167-800 200-800t56.5 23.5Q280-753 280-720t-23.5 56.5Q233-640 200-640t-56.5-23.5Z" /></svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" onClick={() => removeQuestion(index)} /></svg>
                                        </div>
                                    </div>
                                    <div className="student-input-preview">
                                        {renderStudentInputPreview(question, index)}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="add-question-div">
                    <div className="add-new-question-header">
                        <div className="horizontal-line"></div>
                        <button type="button" className="text-div" onClick={toggleQuestionTypeVisibility}>
                            <svg></svg>
                            <div>
                                <span>Add New Question</span>
                            </div>
                        </button>
                        <div className="horizontal-line"></div>
                    </div>

                    {
                        questionTypeVisibility && (
                            <div className="question-types-div">
                                {questionTypes.map((type) => (
                                    <button key={type.questionTypeId} type="button" className="one-question-type-div" onClick={() => addQuestion(type.questionTypeId)}>
                                        {renderQuestionTypeIcon(type.typeName)}
                                        <div className="question-type-name-div">
                                            {formatQuestionTypeName(type.typeName)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )
                    }

                </div>
            </form>
            <div className="last-button-div">
                <button type="submit" form="registration-form-container" id="submit-button">
                    Create Registration Form
                </button>
            </div>
        </main>
    )
}

export default CreateRegistrationPage;