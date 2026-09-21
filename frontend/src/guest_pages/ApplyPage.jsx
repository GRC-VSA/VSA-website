import { useEffect, useState } from "react";

import "./ApplyPage.css";

import noapplication from "../assets/guest/noapplication.png";
import applicationBackground from "../assets/guest/officer-application-background.png";
import { FaCheckCircle } from "react-icons/fa";

import {
    getRecruitmentStatus,
    getOpenApplicationRoles,
    startApplication,
    saveApplication,
    submitApplication,
    getMyApplications
} from "../api/Application";


const ApplyPage = () => {

    const [loading, setLoading] = useState(true);
    const [recruitmentOpen, setRecruitmentOpen] = useState(false);

    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState("");

    const [application, setApplication] = useState(null);
    const [myApplications, setMyApplications] = useState([]);
    /*
     * {
     *   questionId: {
     *      answerText: "...",
     *      optionIds: [...]
     *   }
     * }
     */
    const [answers, setAnswers] = useState({});

    const [currentStep, setCurrentStep] = useState(0);

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD PAGE
    // =========================================================

    useEffect(() => {

        const loadApplicationPage = async () => {

            try {

                setLoading(true);
                setError("");

                const status =
                    await getRecruitmentStatus();

                setRecruitmentOpen(
                    status.recruitmentOpen
                );


                if (!status.recruitmentOpen) {
                    return;
                }


                const [openRoles, existingApplications] =
                    await Promise.all([getOpenApplicationRoles(), getMyApplications()]);

                setRoles(openRoles);
                setMyApplications(existingApplications);
            }
            catch (error) {

                console.error(error);

                setError(
                    error.message ||
                    "Failed to load officer applications."
                );

            }
            finally {

                setLoading(false);

            }
        };


        loadApplicationPage();

    }, []);


    // =========================================================
    // ROLE / SECTION INFORMATION
    // =========================================================

    const selectedRole = roles.find(role => role.applicationRoleId === Number(selectedRoleId));
    const completedApplicationForSelectedRole = myApplications.find(application =>
        application.applicationRoleId === Number(selectedRoleId) && application.status === "COMPLETED");

    const alreadySubmitted = Boolean(completedApplicationForSelectedRole);

    /*
     * Get to Know You exists on every role.
     *
     * We find it independently so Step 1 can render
     * BEFORE a role is selected.
     */
    const getToKnowYouSection =
        roles
            .flatMap(
                role =>
                    role.sections || []
            )
            .find(
                section =>
                    section.systemKey ===
                    "GET_TO_KNOW_YOU"
            );


    /*
     * Before role selection:
     *
     * sections = [Get to Know You]
     *
     * After role selection:
     *
     * sections = all sections belonging to that role
     */
    const sections =
        selectedRole
            ? selectedRole.sections || []
            : getToKnowYouSection
                ? [getToKnowYouSection]
                : [];


    const currentSection =
        sections[currentStep];


    const completed =
        application?.status === "COMPLETED";


    // =========================================================
    // PROGRESS
    // =========================================================

    /*
     * Before the user selects a role, we don't actually
     * know how many steps there are because each role can
     * have different sections.
     */
    const progressLabel =
        selectedRole
            ? `Step ${currentStep + 1} of ${sections.length}`
            : "Step 1";


    const progressPercent =
        selectedRole && sections.length > 0
            ? (
                (currentStep + 1)
                /
                sections.length
            ) * 100
            : 20;


    // =========================================================
    // ROLE SELECTION
    // =========================================================

    const handleRoleChange = (event) => {
        setSaveSuccess(false);
        const roleId =
            event.target.value;


        setSelectedRoleId(roleId);

        setApplication(null);

        setCurrentStep(0);

        setError("");
    };


    // =========================================================
    // TEXT ANSWER
    // =========================================================

    const handleTextAnswerChange = (questionId, value) => {
        setSaveSuccess(false);
        setAnswers(previous => ({

            ...previous,

            [questionId]: {

                answerText: value,

                optionIds:
                    previous[questionId]?.optionIds || []

            }

        }));
    };


    // =========================================================
    // SINGLE CHOICE
    // =========================================================

    const handleSingleChoiceChange = (
        questionId,
        optionId
    ) => {
        setSaveSuccess(false);
        setAnswers(previous => ({

            ...previous,

            [questionId]: {

                answerText: null,

                optionIds: [
                    optionId
                ]

            }

        }));
    };


    // =========================================================
    // MULTIPLE CHOICE
    // =========================================================

    const handleMultipleChoiceChange = (
        questionId,
        optionId,
        checked
    ) => {
        setSaveSuccess(false);
        setAnswers(previous => {

            const existingOptions =
                previous[questionId]?.optionIds || [];


            let nextOptions;


            if (checked) {

                nextOptions = [
                    ...existingOptions,
                    optionId
                ];

            }
            else {

                nextOptions =
                    existingOptions.filter(
                        id =>
                            id !== optionId
                    );

            }


            return {

                ...previous,

                [questionId]: {

                    answerText: null,

                    optionIds: nextOptions

                }

            };
        });
    };


    // =========================================================
    // CONVERT BACKEND ANSWERS
    // =========================================================

    const convertApplicationAnswers = (
        applicationData
    ) => {

        const restoredAnswers = {};


        for (
            const answer of applicationData.answers || []
        ) {

            restoredAnswers[
                answer.questionId
            ] = {

                answerText:
                    answer.answerText ?? "",

                optionIds:
                    answer.selectedOptionIds || []

            };
        }


        return restoredAnswers;
    };


    // =========================================================
    // START OR RESUME APPLICATION
    // =========================================================

    const ensureApplicationStarted =
        async () => {

            /*
             * Already started during this page session.
             */
            if (application) {

                return {
                    currentApplication: application,
                    currentAnswers: answers
                };
            }


            if (!selectedRoleId) {

                throw new Error(
                    "Please select the officer role you are applying for."
                );

            }


            /*
             * Backend behavior:
             *
             * New role/application:
             * → creates IN_PROGRESS
             *
             * Existing role/application:
             * → returns the existing application
             */
            const applicationData =
                await startApplication(
                    Number(selectedRoleId)
                );


            const restoredAnswers =
                convertApplicationAnswers(
                    applicationData
                );


            /*
             * Existing DB answers first.
             *
             * Answers the user already typed in the browser
             * override them.
             */
            const mergedAnswers = {

                ...restoredAnswers,
                ...answers

            };


            setApplication(
                applicationData
            );

            setAnswers(
                mergedAnswers
            );


            return {

                currentApplication:
                    applicationData,

                currentAnswers:
                    mergedAnswers

            };
        };


    // =========================================================
    // BUILD BACKEND REQUEST
    // =========================================================

    const buildAnswerPayload = (
        answerState = answers
    ) => {

        if (!selectedRole) {
            return [];
        }


        return selectedRole.sections.flatMap(
            section =>

                section.questions
                    .filter(
                        question =>
                            question.active !== false
                    )
                    .map(
                        question => {

                            const answer =
                                answerState[
                                question.questionId
                                ] || {
                                    answerText: "",
                                    optionIds: []
                                };


                            return {

                                questionId:
                                    question.questionId,

                                answerText:
                                    answer.answerText ?? null,

                                optionIds:
                                    answer.optionIds || []

                            };
                        }
                    )
        );
    };


    // =========================================================
    // SAVE PROGRESS
    // =========================================================

    const handleSaveProgress =
        async () => {

            try {
                if (alreadySubmitted) {
                    return;
                }
                setSaving(true);
                setError("");
                setSaveSuccess(false);

                const { currentApplication, currentAnswers } = await ensureApplicationStarted();
                // console.log("APPLICATION:", currentApplication);
                // console.log("SECTIONS:", sections);
                // console.log("CURRENT STEP:", currentStep);
                console.log(
                    "STATUS BEFORE SAVE:",
                    currentApplication.status
                );


                /*
                 * COMPLETED applications are read-only.
                 */
                if (
                    currentApplication.status ===
                    "COMPLETED"
                ) {

                    return;

                }


                const savedApplication =
                    await saveApplication(
                        currentApplication.applicationId,
                        buildAnswerPayload(
                            currentAnswers
                        )
                    );

                setApplication(
                    savedApplication
                );
                setSaveSuccess(true);
            }
            catch (error) {

                console.error(error);

                setError(
                    error.message ||
                    "Failed to save application."
                );

            }
            finally {

                setSaving(false);

            }
        };

    const handleNext = (event) => {

        event.preventDefault();
        if (alreadySubmitted) {
            return;
        }
        if (!selectedRoleId) {
            setError(
                "Please select the officer role you are applying for."
            );
            return;
        }

        setError("");

        if (currentStep < sections.length - 1) {
            setCurrentStep(
                previous => previous + 1
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };

    // =========================================================
    // PREVIOUS SECTION
    // =========================================================

    const handlePrevious = () => {

        if (currentStep <= 0) {
            return;
        }


        setCurrentStep(
            previous =>
                previous - 1
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =========================================================
    // SUBMIT APPLICATION
    // =========================================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();
            if (alreadySubmitted) {
                return;
            }

            try {
                setSaving(true);
                setError("");


                const { currentApplication, currentAnswers } = await ensureApplicationStarted();

                if (
                    currentApplication.status ===
                    "COMPLETED"
                ) {

                    return;

                }


                const submittedApplication = await submitApplication(
                    currentApplication.applicationId,
                    buildAnswerPayload(currentAnswers)
                );

                setApplication(submittedApplication);
                setMyApplications(previous => {
                    const withoutCurrentApplication =
                        previous.filter(application => application.applicationId !== submittedApplication.applicationId);
                    return [...withoutCurrentApplication, submittedApplication];
                });

            }
            catch (error) {

                console.error(error);

                setError(
                    error.message ||
                    "Failed to submit application."
                );

            }
            finally {

                setSaving(false);

            }
        };


    // =========================================================
    // LOADING
    // =========================================================

    /*
     * Don't show "Checking recruitment..."
     */
    if (loading) {
        return null;
    }


    // =========================================================
    // PAGE LOAD ERROR
    // =========================================================

    if (
        error &&
        !recruitmentOpen
    ) {

        return (

            <main className="apply-page page-footer-space">

                <div className="recruitment-coming-soon">

                    <h1>
                        We couldn't load officer recruitment.
                        <br />
                        Please try again later.
                    </h1>

                </div>

            </main>
        );
    }


    // =========================================================
    // RECRUITMENT CLOSED
    // =========================================================

    if (!recruitmentOpen) {

        return (

            <main className="apply-page page-footer-space">

                <div className="recruitment-coming-soon">

                    <div className="recruit-image-placeholder">

                        <img
                            src={noapplication}
                            alt="VSA is not currently recruiting"
                        />

                    </div>


                    <h1>
                        We are not recruiting at the moment.
                        <br />
                        Hope to see you again soon!
                    </h1>

                </div>

            </main>
        );
    }


    // =========================================================
    // APPLICATION FORM
    // =========================================================

    return (

        <main
            className="officer-application-page page-footer-space"
            style={{
                backgroundImage:
                    `url(${applicationBackground})`
            }}
        >

            <div className="officer-application-card">


                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="application-header">

                    <div className="application-eyebrow">

                        <span />

                        <p>
                            VSA OFFICER RECRUITMENT
                        </p>

                        <span />

                    </div>


                    <h1>
                        Officer Application
                    </h1>


                </div>


                {/* =====================================================
                    FORM EXISTS AS SOON AS GTKY EXISTS
                ===================================================== */}

                {currentSection && (

                    <>


                        {/* =============================================
                            PROGRESS BAR
                            ============================================= */}

                        <div className="application-progress-row">

                            <div className="application-progress-track">

                                <div
                                    className="application-progress-fill"
                                    style={{
                                        width:
                                            `${progressPercent}%`
                                    }}
                                />

                            </div>


                            <span className="application-progress-label">

                                {progressLabel}

                            </span>

                        </div>

                        {completed ? (

                            <div className="application-submit-success">


                                <h2>
                                    Application submitted successfully!
                                </h2>

                                <FaCheckCircle
                                    className="application-submit-success-icon"
                                />
                            </div>

                        ) : (
                            <div className="application-step-scroll">

                                <h2 className="current-section-heading">
                                    {currentSection.sectionHeading}
                                </h2>


                                {currentSection.sectionDescription && (

                                    <p className="application-section-description">

                                        {
                                            currentSection
                                                .sectionDescription
                                        }

                                    </p>

                                )}

                                {error && (

                                    <div className="application-error">
                                        {error}
                                    </div>

                                )}

                                <form
                                    className="application-form"
                                    onSubmit={
                                        selectedRole &&
                                            currentStep ===
                                            sections.length - 1

                                            ? handleSubmit

                                            : handleNext
                                    }
                                >

                                    <div className="application-question-grid">

                                        {currentSection.questions
                                            .filter(
                                                question =>
                                                    question.active !== false
                                            )
                                            .map(
                                                question => (

                                                    <ApplicationQuestionField

                                                        key={
                                                            question.questionId
                                                        }

                                                        question={
                                                            question
                                                        }

                                                        answer={
                                                            answers[
                                                            question.questionId
                                                            ]
                                                        }

                                                        disabled={saving || alreadySubmitted}

                                                        onTextChange={
                                                            handleTextAnswerChange
                                                        }

                                                        onSingleChoiceChange={
                                                            handleSingleChoiceChange
                                                        }

                                                        onMultipleChoiceChange={
                                                            handleMultipleChoiceChange
                                                        }

                                                    />

                                                )
                                            )}

                                        {
                                            currentSection.systemKey ===
                                            "GET_TO_KNOW_YOU"
                                            && (

                                                <div className="application-role-selector">

                                                    <label
                                                        className="application-question-label"
                                                        htmlFor="application-role"
                                                    >

                                                        Role Applying For

                                                        <span className="required-star">
                                                            *
                                                        </span>

                                                    </label>


                                                    <select
                                                        id="application-role"
                                                        className="application-role-select"
                                                        value={selectedRoleId}
                                                        onChange={handleRoleChange}
                                                        disabled={saving}
                                                        required
                                                    >

                                                        <option value="">
                                                            Select a role
                                                        </option>


                                                        {roles.map(
                                                            role => (

                                                                <option
                                                                    key={
                                                                        role.applicationRoleId
                                                                    }
                                                                    value={
                                                                        role.applicationRoleId
                                                                    }
                                                                >
                                                                    {role.name}
                                                                </option>

                                                            )
                                                        )}

                                                    </select>
                                                    {alreadySubmitted && (
                                                        <p className="application-already-submitted">
                                                            You have already submitted an application for this role.
                                                        </p>
                                                    )}

                                                </div>

                                            )
                                        }

                                    </div>

                                    {
                                        saveSuccess && (
                                            <p className="application-save-success">Application progress has been saved!</p>
                                        )
                                    }
                                    <div className="application-actions">


                                        {currentStep > 0 && (

                                            <button
                                                type="button"
                                                className="application-back-button"
                                                onClick={handlePrevious}
                                                disabled={saving}
                                            >
                                                ← Back
                                            </button>

                                        )}


                                        <button
                                            type="button"
                                            className="application-save-button"
                                            onClick={handleSaveProgress}
                                            disabled={saving || !selectedRoleId || alreadySubmitted}
                                        >

                                            {
                                                saving
                                                    ? "Saving..."
                                                    : "Save Progress"
                                            }

                                        </button>


                                        {
                                            currentStep <
                                                sections.length - 1

                                                ? (

                                                    <button
                                                        type="submit"
                                                        className="application-next-button"
                                                        disabled={saving || alreadySubmitted}
                                                    >

                                                        Next

                                                        <span>
                                                            →
                                                        </span>

                                                    </button>

                                                )

                                                : selectedRole

                                                    ? (

                                                        <button
                                                            type="submit"
                                                            className="application-submit-button"
                                                            disabled={saving || alreadySubmitted}
                                                        >

                                                            Submit Application

                                                        </button>

                                                    )

                                                    : (

                                                        <button
                                                            type="submit"
                                                            className="application-next-button"
                                                            disabled={saving}
                                                        >

                                                            Next

                                                            <span>
                                                                →
                                                            </span>

                                                        </button>

                                                    )
                                        }

                                    </div>

                                </form>

                            </div>

                        )}
                    </>

                )}

            </div>

        </main>
    );
};


// =============================================================
// QUESTION FIELD
// =============================================================

const ApplicationQuestionField = ({
    question,
    answer,
    disabled,
    onTextChange,
    onSingleChoiceChange,
    onMultipleChoiceChange
}) => {

    const answerText =
        answer?.answerText ?? "";


    const optionIds =
        answer?.optionIds || [];


    const label = (

        <label className="application-question-label">

            {question.questionText}


            {question.required && (

                <span className="required-star">
                    *
                </span>

            )}

        </label>
    );


    // =========================================================
    // LONG TEXT
    // =========================================================

    if (
        question.questionType ===
        "long_text"
    ) {

        return (

            <div className="application-question application-question-full">

                {label}

                <textarea
                    rows="5"
                    value={answerText}
                    required={question.required}
                    disabled={disabled}
                    onChange={
                        event =>
                            onTextChange(
                                question.questionId,
                                event.target.value
                            )
                    }
                />

            </div>
        );
    }


    // =========================================================
    // SINGLE CHOICE
    // =========================================================

    if (
        question.questionType ===
        "single_choice"
    ) {

        return (

            <fieldset className="application-question application-question-choice">

                <legend>

                    {question.questionText}


                    {question.required && (

                        <span className="required-star">
                            *
                        </span>

                    )}

                </legend>


                <div className="application-options">

                    {question.options.map(
                        option => (

                            <label
                                key={option.optionId}
                                className="application-option"
                            >

                                <input
                                    type="radio"
                                    name={
                                        `question-${question.questionId}`
                                    }
                                    checked={
                                        optionIds.includes(
                                            option.optionId
                                        )
                                    }
                                    disabled={disabled}
                                    required={question.required}
                                    onChange={
                                        () =>
                                            onSingleChoiceChange(
                                                question.questionId,
                                                option.optionId
                                            )
                                    }
                                />


                                <span>
                                    {option.optionText}
                                </span>

                            </label>

                        )
                    )}

                </div>

            </fieldset>
        );
    }


    // =========================================================
    // MULTIPLE CHOICE
    // =========================================================

    if (
        question.questionType ===
        "multiple_choice"
    ) {

        return (

            <fieldset className="application-question application-question-choice">

                <legend>

                    {question.questionText}


                    {question.required && (

                        <span className="required-star">
                            *
                        </span>

                    )}

                </legend>


                <div className="application-options">

                    {question.options.map(
                        option => (

                            <label
                                key={option.optionId}
                                className="application-option"
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        optionIds.includes(
                                            option.optionId
                                        )
                                    }
                                    disabled={disabled}
                                    onChange={
                                        event =>
                                            onMultipleChoiceChange(
                                                question.questionId,
                                                option.optionId,
                                                event.target.checked
                                            )
                                    }
                                />


                                <span>
                                    {option.optionText}
                                </span>

                            </label>

                        )
                    )}

                </div>

            </fieldset>
        );
    }


    // =========================================================
    // STANDARD INPUT TYPES
    // =========================================================

    const inputTypes = {

        short_text: "text",

        email: "email",

        phone: "tel",

        number: "number",

        date: "date",

        url: "url"

    };


    const inputType =
        inputTypes[
        question.questionType
        ] || "text";


    return (

        <div className="application-question">

            {label}

            <input
                type={inputType}
                value={answerText}
                required={question.required}
                disabled={disabled}
                onChange={
                    event =>
                        onTextChange(
                            question.questionId,
                            event.target.value
                        )
                }
            />

        </div>
    );
};


export default ApplyPage;