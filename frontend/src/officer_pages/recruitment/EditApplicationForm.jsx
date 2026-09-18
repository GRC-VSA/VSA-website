import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuX, LuChevronDown } from "react-icons/lu";
import "./EditApplicationForm.css";

import UnsavedChangesWarning from "../../components/UnsavedChangesWarning.jsx";
import {
    getRecruitmentStatus,
    setRecruitmentStatus,

    getApplicationRoles,
    createApplicationRole,
    updateApplicationRole,
    setRoleRecruiting,
    deleteApplicationRole,

    createApplicationSection,
    updateApplicationSection,
    deleteApplicationSection,

    createApplicationQuestion,
    updateApplicationQuestion,
    deleteApplicationQuestion,
    saveApplicationBuilder
} from "../../api/Application.js";


const QUESTION_TYPES = [
    {
        value: "short_text",
        label: "Short Text"
    },
    {
        value: "long_text",
        label: "Long Text"
    },
    {
        value: "number",
        label: "Number"
    },
    {
        value: "email",
        label: "Email"
    },
    {
        value: "phone",
        label: "Phone"
    },
    {
        value: "single_choice",
        label: "Single Choice"
    },
    {
        value: "multiple_choice",
        label: "Multiple Choice"
    },
    {
        value: "date",
        label: "Date"
    },
    {
        value: "url",
        label: "URL"
    }
];

const buildBuilderPayload = (
    recruitmentOpen,
    roles
) => {

    const sections = new Map();


    for (const role of roles) {

        for (const section of role.sections || []) {

            let storedSection =
                sections.get(
                    section.sectionId
                );


            if (!storedSection) {

                storedSection = {

                    clientId:
                        section.sectionId,

                    sectionId:
                        section.sectionId > 0
                            ? section.sectionId
                            : null,

                    sectionHeading:
                        section.sectionHeading,

                    sectionDescription:
                        section.sectionDescription || "",

                    systemKey:
                        section.systemKey || null,

                    roleClientIds: [],


                    questions:
                        (section.questions || [])
                            .map(
                                question => ({

                                    questionId:
                                        Number(question.questionId) > 0
                                            ? Number(question.questionId)
                                            : null,

                                    questionText:
                                        question.questionText,

                                    questionType:
                                        question.questionType,

                                    required:
                                        question.required,

                                    active:
                                        question.active !== false,

                                    options:
                                        (question.options || [])
                                            .map(
                                                option =>
                                                    typeof option === "string"
                                                        ? option
                                                        : option.optionText
                                            )
                                })
                            )
                };


                sections.set(
                    section.sectionId,
                    storedSection
                );
            }


            if (
                !storedSection
                    .roleClientIds
                    .includes(
                        role.applicationRoleId
                    )
            ) {

                storedSection
                    .roleClientIds
                    .push(
                        role.applicationRoleId
                    );
            }
        }
    }


    return {

        recruitmentOpen,


        roles:
            roles.map(
                role => ({

                    applicationRoleId:
                        Number(role.applicationRoleId) > 0
                            ? Number(role.applicationRoleId)
                            : null,

                    name:
                        role.name,

                    description:
                        role.description || "",

                    recruiting:
                        role.recruiting,

                    sectionClientIds:
                        (role.sections || [])
                            .map(
                                section =>
                                    Number(section.sectionId)
                            )
                })
            ),


        sections:
            Array.from(
                sections.values()
            )
    };
};

let nextTemporaryId = -1;

const createTemporaryId = () => {
    const id = nextTemporaryId;
    nextTemporaryId -= 1;
    return id;
};

const EditApplicationForm = () => {

    const [loading, setLoading] = useState(true);
    const [savedDraftSnapshot, setSavedDraftSnapshot] =
        useState("");

    const [savingChanges, setSavingChanges] =
        useState(false);
    const [recruitmentOpen, setRecruitmentOpenState] =
        useState(false);

    const [roles, setRoles] =
        useState([]);

    const [selectedRoleId, setSelectedRoleId] =
        useState("");

    const [busy, setBusy] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    /*
     * dialog is:
     *
     * {
     *      type: "role" | "section" | "question",
     *      mode: "create" | "edit",
     *      data: ...
     * }
     */
    const [dialog, setDialog] =
        useState(null);

    const currentDraftSnapshot =
        JSON.stringify(buildBuilderPayload(recruitmentOpen, roles));


    const hasUnsavedChanges =
        currentDraftSnapshot !==
        savedDraftSnapshot;

    // =========================================================
    // LOAD BUILDER
    // =========================================================

    const loadBuilder = async (preferredRoleId = null) => {

        try {

            const [
                recruitmentStatus,
                roleData
            ] =
                await Promise.all([
                    getRecruitmentStatus(),
                    getApplicationRoles()
                ]);


            setRecruitmentOpenState(
                recruitmentStatus.recruitmentOpen
            );

            setRoles(roleData);

            setSavedDraftSnapshot(JSON.stringify(buildBuilderPayload(
                recruitmentStatus.recruitmentOpen,
                roleData
            )
            )
            );


            setSelectedRoleId(previous => {

                const preferred =
                    preferredRoleId ??
                    previous;


                if (
                    preferred &&
                    roleData.some(
                        role =>
                            role.applicationRoleId ===
                            Number(preferred)
                    )
                ) {
                    return Number(preferred);
                }


                return (
                    roleData[0]
                        ?.applicationRoleId ??
                    ""
                );

            });

        }
        catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to load the application form builder."
            );

        }
    };
    const buildDraftOptions = (
        optionTexts,
        existingOptions = []
    ) => {

        return optionTexts.map(
            (
                optionText,
                index
            ) => ({

                optionId:
                    existingOptions[index]
                        ?.optionId ??
                    createTemporaryId(),

                optionText,

                displayOrder:
                    index + 1
            })
        );
    };


    useEffect(() => {

        const initialize = async () => {

            setLoading(true);

            await loadBuilder();

            setLoading(false);

        };


        initialize();

    }, []);


    // =========================================================
    // SELECTED ROLE
    // =========================================================

    const selectedRole =
        roles.find(
            role =>
                role.applicationRoleId ===
                Number(selectedRoleId)
        );


    // =========================================================
    // MESSAGE HELPERS
    // =========================================================

    const clearMessages = () => {

        setError("");
        setSuccess("");

    };


    const showError = (
        error,
        fallback
    ) => {

        console.error(error);

        setError(
            error.message ||
            fallback
        );

        setSuccess("");

    };


    // =========================================================
    // GLOBAL RECRUITMENT
    // =========================================================

    const handleRecruitmentToggle = () => {

        clearMessages();

        setRecruitmentOpenState(
            previous => !previous
        );
    };

    // =========================================================
    // ROLE RECRUITING
    // =========================================================

    const handleRoleRecruitingToggle =
        (role) => {

            clearMessages();

            setRoles(
                previous =>
                    previous.map(
                        currentRole =>

                            currentRole.applicationRoleId ===
                                role.applicationRoleId

                                ? {
                                    ...currentRole,

                                    recruiting:
                                        !currentRole.recruiting
                                }

                                : currentRole
                    )
            );
        };
    // =========================================================
    // ROLE DIALOG
    // =========================================================

    const openCreateRole = () => {

        clearMessages();

        setDialog({
            type: "role",
            mode: "create",
            data: null
        });
    };


    const openEditRole = (role) => {

        clearMessages();

        setDialog({
            type: "role",
            mode: "edit",
            data: role
        });
    };


    const handleRoleSubmit = ({
        name,
        description
    }) => {

        clearMessages();


        if (dialog.mode === "create") {

            const temporaryRoleId =
                createTemporaryId();


            const permanentSection =
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


            const newRole = {

                applicationRoleId:
                    temporaryRoleId,

                name:
                    name.trim(),

                description:
                    description.trim(),

                recruiting:
                    false,

                sections:
                    permanentSection
                        ? [
                            {
                                ...permanentSection,

                                roleIds: [
                                    ...new Set([
                                        ...(permanentSection.roleIds || []),

                                        temporaryRoleId
                                    ])
                                ]
                            }
                        ]
                        : []
            };


            setRoles(
                previous => [
                    ...previous,
                    newRole
                ]
            );


            setSelectedRoleId(
                temporaryRoleId
            );

        }
        else {

            setRoles(
                previous =>
                    previous.map(
                        role =>

                            role.applicationRoleId ===
                                dialog.data.applicationRoleId

                                ? {
                                    ...role,
                                    name: name.trim(),
                                    description:
                                        description.trim()
                                }

                                : role
                    )
            );
        }


        setDialog(null);
    };


    const handleDeleteRole = (
        role
    ) => {

        const confirmed =
            window.confirm(
                `Delete the role "${role.name}"?`
            );


        if (!confirmed) {
            return;
        }


        clearMessages();


        const remainingRoles =
            roles.filter(
                currentRole =>
                    currentRole.applicationRoleId !==
                    role.applicationRoleId
            );


        setRoles(
            remainingRoles
                .map(
                    currentRole => ({

                        ...currentRole,

                        sections:
                            (currentRole.sections || [])
                                .map(
                                    section => ({

                                        ...section,

                                        roleIds:
                                            (section.roleIds || [])
                                                .filter(
                                                    roleId =>
                                                        roleId !==
                                                        role.applicationRoleId
                                                )
                                    })
                                )
                    })
                )
        );


        if (
            Number(selectedRoleId) ===
            role.applicationRoleId
        ) {

            setSelectedRoleId(
                remainingRoles[0]
                    ?.applicationRoleId ??
                ""
            );
        }
    };

    // =========================================================
    // SECTION DIALOG
    // =========================================================

    const openCreateSection = () => {

        if (!selectedRole) {
            return;
        }


        clearMessages();


        setDialog({
            type: "section",
            mode: "create",
            data: {
                roleIds: [
                    selectedRole.applicationRoleId
                ]
            }
        });
    };


    const openEditSection = (
        section
    ) => {

        clearMessages();


        setDialog({
            type: "section",
            mode: "edit",
            data: section
        });
    };


    const handleSectionSubmit = ({
        sectionHeading,
        sectionDescription,
        roleIds
    }) => {

        clearMessages();


        if (dialog.mode === "create") {

            const temporarySectionId =
                createTemporaryId();


            setRoles(
                previous =>
                    previous.map(
                        role => {

                            if (
                                !roleIds.includes(
                                    role.applicationRoleId
                                )
                            ) {
                                return role;
                            }


                            const sections =
                                role.sections || [];


                            const nextDisplayOrder =
                                sections.length === 0

                                    ? 1

                                    : Math.max(
                                        ...sections.map(
                                            section =>
                                                section.displayOrder || 0
                                        )
                                    ) + 1;


                            return {

                                ...role,

                                sections: [
                                    ...sections,

                                    {
                                        sectionId:
                                            temporarySectionId,

                                        sectionHeading:
                                            sectionHeading.trim(),

                                        sectionDescription:
                                            sectionDescription.trim(),

                                        systemKey:
                                            null,

                                        displayOrder:
                                            nextDisplayOrder,

                                        roleIds:
                                            [...roleIds],

                                        questions: []
                                    }
                                ]
                            };
                        }
                    )
            );

        }
        else {

            const sectionId =
                dialog.data.sectionId;


            setRoles(
                previous =>
                    previous.map(
                        role => {

                            const shouldContainSection =
                                roleIds.includes(
                                    role.applicationRoleId
                                );


                            const currentSection =
                                (role.sections || [])
                                    .find(
                                        section =>
                                            section.sectionId ===
                                            sectionId
                                    );


                            /*
                             * Remove section from this role.
                             */
                            if (
                                currentSection &&
                                !shouldContainSection
                            ) {

                                return {
                                    ...role,

                                    sections:
                                        role.sections.filter(
                                            section =>
                                                section.sectionId !==
                                                sectionId
                                        )
                                };
                            }


                            /*
                             * Update section already on role.
                             */
                            if (
                                currentSection &&
                                shouldContainSection
                            ) {

                                return {

                                    ...role,

                                    sections:
                                        role.sections.map(
                                            section =>

                                                section.sectionId ===
                                                    sectionId

                                                    ? {
                                                        ...section,

                                                        sectionHeading:
                                                            sectionHeading.trim(),

                                                        sectionDescription:
                                                            sectionDescription.trim(),

                                                        roleIds:
                                                            [...roleIds]
                                                    }

                                                    : section
                                        )
                                };
                            }


                            /*
                             * Section has now been shared with
                             * another role.
                             */
                            if (
                                !currentSection &&
                                shouldContainSection
                            ) {

                                return {

                                    ...role,

                                    sections: [
                                        ...(role.sections || []),

                                        {
                                            ...dialog.data,

                                            sectionHeading:
                                                sectionHeading.trim(),

                                            sectionDescription:
                                                sectionDescription.trim(),

                                            roleIds:
                                                [...roleIds],

                                            displayOrder:
                                                (role.sections?.length || 0)
                                                + 1
                                        }
                                    ]
                                };
                            }


                            return role;
                        }
                    )
            );
        }


        setDialog(null);
    };

    const handleDeleteSection = (
        section
    ) => {

        const confirmed =
            window.confirm(
                `Delete the section "${section.sectionHeading}"?`
            );


        if (!confirmed) {
            return;
        }


        clearMessages();


        setRoles(
            previous =>
                previous.map(
                    role => ({

                        ...role,

                        sections:
                            (role.sections || [])
                                .filter(
                                    currentSection =>
                                        currentSection.sectionId !==
                                        section.sectionId
                                )
                    })
                )
        );
    };


    // =========================================================
    // QUESTION DIALOG
    // =========================================================

    const openCreateQuestion = (
        section
    ) => {

        clearMessages();


        setDialog({
            type: "question",
            mode: "create",
            data: {
                sectionId:
                    section.sectionId,

                sectionHeading:
                    section.sectionHeading
            }
        });
    };


    const openEditQuestion = (
        section,
        question
    ) => {

        clearMessages();


        setDialog({
            type: "question",
            mode: "edit",
            data: {
                ...question,

                sectionId:
                    section.sectionId,

                sectionHeading:
                    section.sectionHeading
            }
        });
    };


    const handleQuestionSubmit = ({
        questionText,
        questionType,
        required,
        options
    }) => {

        clearMessages();


        const sectionId =
            dialog.data.sectionId;


        if (dialog.mode === "create") {

            const temporaryQuestionId =
                createTemporaryId();


            setRoles(
                previous =>
                    previous.map(
                        role => ({

                            ...role,

                            sections:
                                (role.sections || [])
                                    .map(
                                        section => {

                                            if (
                                                section.sectionId !==
                                                sectionId
                                            ) {
                                                return section;
                                            }


                                            const existingQuestions =
                                                section.questions || [];


                                            return {

                                                ...section,

                                                questions: [
                                                    ...existingQuestions,

                                                    {
                                                        questionId:
                                                            temporaryQuestionId,

                                                        questionText:
                                                            questionText.trim(),

                                                        questionType,

                                                        required,

                                                        active:
                                                            true,

                                                        orderNum:
                                                            existingQuestions.length
                                                            + 1,

                                                        options:
                                                            buildDraftOptions(
                                                                options
                                                            )
                                                    }
                                                ]
                                            };
                                        }
                                    )
                        })
                    )
            );

        }
        else {

            setRoles(
                previous =>
                    previous.map(
                        role => ({

                            ...role,

                            sections:
                                (role.sections || [])
                                    .map(
                                        section => {

                                            if (
                                                section.sectionId !==
                                                sectionId
                                            ) {
                                                return section;
                                            }


                                            return {

                                                ...section,

                                                questions:
                                                    (section.questions || [])
                                                        .map(
                                                            question =>

                                                                question.questionId ===
                                                                    dialog.data.questionId

                                                                    ? {
                                                                        ...question,

                                                                        questionText:
                                                                            questionText.trim(),

                                                                        questionType,

                                                                        required,

                                                                        options:
                                                                            buildDraftOptions(
                                                                                options,
                                                                                question.options || []
                                                                            )
                                                                    }

                                                                    : question
                                                        )
                                            };
                                        }
                                    )
                        })
                    )
            );
        }


        setDialog(null);
    };


    const handleDeleteQuestion = (
        question
    ) => {

        const confirmed =
            window.confirm(
                `Delete the question "${question.questionText}"?`
            );


        if (!confirmed) {
            return;
        }


        clearMessages();


        setRoles(
            previous =>
                previous.map(
                    role => ({

                        ...role,

                        sections:
                            (role.sections || [])
                                .map(
                                    section => ({

                                        ...section,

                                        questions:
                                            (section.questions || [])
                                                .map(
                                                    currentQuestion =>

                                                        currentQuestion.questionId ===
                                                            question.questionId

                                                            ? {
                                                                ...currentQuestion,
                                                                active: false
                                                            }

                                                            : currentQuestion
                                                )
                                    })
                                )
                    })
                )
        );
    };
    const handleSaveChanges =
        async () => {

            if (!hasUnsavedChanges) {
                return;
            }


            clearMessages();

            setSavingChanges(true);


            try {

                const payload =
                    buildBuilderPayload(
                        recruitmentOpen,
                        roles
                    );


                await saveApplicationBuilder(
                    payload
                );


                /*
                 * Reload once after the save.
                 *
                 * This replaces temporary negative IDs
                 * with real database IDs.
                 */
                await loadBuilder();


                setSuccess(
                    "Application form changes saved."
                );

            }
            catch (error) {

                showError(
                    error,
                    "Failed to save application form changes."
                );

            }
            finally {

                setSavingChanges(false);

            }
        };
    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <main className="edit-application-form-page">

                <div className="edit-application-loading">
                    Loading history of officer application...
                </div>

            </main>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <main className="edit-application-form-page">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="edit-application-page-header">

                <div>

                    <p className="edit-application-eyebrow">
                        RECRUITMENT
                    </p>

                    <h1>
                        Edit Application Form
                    </h1>

                    <p className="edit-application-page-description">
                        Manage the officer application that students see
                    </p>

                </div>
                <div className="edit-application-save-area">

                    {hasUnsavedChanges && (

                        <span className="edit-application-unsaved-label">
                            Unsaved changes
                        </span>

                    )}


                    <button
                        type="button"
                        className="edit-application-save-changes-button"
                        disabled={
                            !hasUnsavedChanges ||
                            savingChanges
                        }
                        onClick={
                            handleSaveChanges
                        }
                    >

                        {
                            savingChanges
                                ? "Saving..."
                                : "Save Changes"
                        }

                    </button>

                </div>
            </div>


            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (

                <div className="edit-application-alert edit-application-alert-error">

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <LuX />
                    </button>

                </div>

            )}


            {success && (

                <div className="edit-application-alert edit-application-alert-success">

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <LuX />
                    </button>

                </div>

            )}


            {/* =================================================
                GLOBAL RECRUITMENT
            ================================================= */}

            <section className="edit-application-panel edit-application-recruitment-panel">

                <div className="edit-application-panel-info">

                    <div className="edit-application-panel-title-row">

                        <h2>
                            Recruitment Status
                        </h2>

                        <span
                            className={
                                recruitmentOpen
                                    ? "status-pill status-pill-open"
                                    : "status-pill status-pill-closed"
                            }
                        >

                            {
                                recruitmentOpen
                                    ? "OPEN"
                                    : "CLOSED"
                            }

                        </span>

                    </div>


                    <p>
                        {
                            recruitmentOpen
                                ? "Start or close the recruitment program"
                                : "Recruitment is closed. Students cannot currently submit applications."
                        }
                    </p>

                </div>


                <label className="edit-application-switch">

                    <input
                        type="checkbox"
                        checked={
                            recruitmentOpen
                        }
                        disabled={
                            busy ===
                            "recruitment"
                        }
                        onChange={
                            handleRecruitmentToggle
                        }
                    />

                    <span className="edit-application-switch-slider" />

                </label>

            </section>


            {recruitmentOpen && (

                <div className="edit-application-live-note">

                    Recruitment is live. Changes made here may
                    affect applications that students are currently
                    filling out.

                </div>

            )}


            {/* =================================================
                ROLE MANAGEMENT
            ================================================= */}

            <section className="edit-application-panel">

                <div className="edit-application-section-header">

                    <div>

                        <h2>
                            Officer Roles
                        </h2>

                        <p>
                            Manage officer positions and choose which
                            positions are currently accepting applications.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="edit-application-primary-button"
                        onClick={openCreateRole}
                    >

                        <LuPlus />

                        Add Role

                    </button>

                </div>


                {roles.length > 0 ? (

                    <div className="edit-application-role-list">

                        {roles.map(role => (

                            <div
                                className="edit-application-role-card"
                                key={role.applicationRoleId}
                            >

                                <div className="edit-application-role-card-info">

                                    <div className="edit-application-role-title-row">

                                        <h3>
                                            {role.name}
                                        </h3>

                                        <span
                                            className={
                                                role.recruiting
                                                    ? "role-status role-status-on"
                                                    : "role-status role-status-off"
                                            }
                                        >

                                            {
                                                role.recruiting
                                                    ? "Recruiting"
                                                    : "Not Recruiting"
                                            }

                                        </span>

                                    </div>


                                    {role.description && (

                                        <p>
                                            {role.description}
                                        </p>

                                    )}

                                </div>


                                <div className="edit-application-role-card-controls">

                                    <div className="edit-application-role-recruiting">

                                        <span>
                                            Accept Applications
                                        </span>

                                        <label className="edit-application-switch edit-application-switch-small">

                                            <input
                                                type="checkbox"
                                                checked={role.recruiting}
                                                disabled={
                                                    busy ===
                                                    `role-recruiting-${role.applicationRoleId}`
                                                }
                                                onChange={
                                                    () =>
                                                        handleRoleRecruitingToggle(
                                                            role
                                                        )
                                                }
                                            />

                                            <span className="edit-application-switch-slider" />

                                        </label>

                                    </div>


                                    <div className="edit-application-role-icon-actions">

                                        <button
                                            type="button"
                                            title="Edit role"
                                            onClick={
                                                () =>
                                                    openEditRole(role)
                                            }
                                        >

                                            <LuPencil />

                                        </button>


                                        <button
                                            type="button"
                                            className="danger"
                                            title="Delete role"
                                            disabled={
                                                busy ===
                                                `delete-role-${role.applicationRoleId}`
                                            }
                                            onClick={
                                                () =>
                                                    handleDeleteRole(role)
                                            }
                                        >

                                            <LuTrash2 />

                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                ) : (

                    <div className="edit-application-empty-state">

                        <h3>
                            No officer roles yet
                        </h3>

                        <p>
                            Create the first officer role to begin
                            building an application form.
                        </p>

                        <button
                            type="button"
                            className="edit-application-primary-button"
                            onClick={openCreateRole}
                        >

                            <LuPlus />

                            Create First Role

                        </button>

                    </div>

                )}

            </section>


            {/* =================================================
                FORM BUILDER
            ================================================= */}

            {selectedRole && (

                <section className="edit-application-builder-section">
                    <div className="edit-application-builder-role-picker">

                        <div>

                            <p className="edit-application-builder-label">
                                SET OF QUESTIONS
                            </p>

                            <h2>
                                Choose an Officer Role
                            </h2>

                            <p>
                                This will show the application flow of each officer role
                            </p>

                        </div>


                        <div className="edit-application-role-select-wrapper">

                            <select
                                value={selectedRoleId}
                                onChange={
                                    event =>
                                        setSelectedRoleId(
                                            Number(
                                                event.target.value
                                            )
                                        )
                                }
                            >

                                {roles.map(role => (

                                    <option
                                        key={role.applicationRoleId}
                                        value={role.applicationRoleId}
                                    >
                                        {role.name}
                                    </option>

                                ))}

                            </select>

                            <LuChevronDown />

                        </div>

                    </div>
                    <div className="edit-application-builder-header">

                        <div>

                            <h2>
                                {selectedRole.name}
                            </h2>

                            <p>
                                Each section becomes one step in the
                                student application.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="edit-application-primary-button"
                            onClick={openCreateSection}
                        >

                            <LuPlus />

                            Add Section

                        </button>

                    </div>


                    <div className="edit-application-sections">

                        {
                            selectedRole.sections
                                ?.map(
                                    (
                                        section,
                                        index
                                    ) => {

                                        const permanent =
                                            section.systemKey ===
                                            "GET_TO_KNOW_YOU";


                                        const activeQuestions =
                                            section.questions
                                                ?.filter(
                                                    question =>
                                                        question.active !==
                                                        false
                                                )
                                            || [];


                                        return (

                                            <article
                                                className="edit-application-section-card"
                                                key={
                                                    section.sectionId
                                                }
                                            >

                                                <div className="edit-application-section-card-header">

                                                    <div className="edit-application-section-number">

                                                        {
                                                            section.displayOrder ??
                                                            index + 1
                                                        }

                                                    </div>


                                                    <div className="edit-application-section-card-heading">

                                                        <div className="edit-application-section-title-row">

                                                            <h3>
                                                                {
                                                                    section.sectionHeading
                                                                }
                                                            </h3>


                                                            {permanent && (

                                                                <span className="permanent-section-badge">
                                                                    Permanent
                                                                </span>

                                                            )}


                                                            {
                                                                !permanent &&
                                                                activeQuestions.length ===
                                                                0
                                                                && (

                                                                    <span className="draft-section-badge">
                                                                        Draft
                                                                    </span>

                                                                )
                                                            }

                                                        </div>


                                                        {
                                                            section.sectionDescription
                                                            && (

                                                                <p>
                                                                    {
                                                                        section.sectionDescription
                                                                    }
                                                                </p>

                                                            )
                                                        }


                                                        {
                                                            section.roleIds
                                                                ?.length >
                                                            1
                                                            && (

                                                                <span className="shared-section-label">

                                                                    Shared with {
                                                                        section.roleIds.length
                                                                    } roles

                                                                </span>

                                                            )
                                                        }

                                                    </div>


                                                    {!permanent && (

                                                        <div className="edit-application-section-card-actions">

                                                            <button
                                                                type="button"
                                                                title="Edit section"
                                                                onClick={
                                                                    () =>
                                                                        openEditSection(
                                                                            section
                                                                        )
                                                                }
                                                            >

                                                                <LuPencil />

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="danger"
                                                                title="Delete section"
                                                                disabled={
                                                                    busy ===
                                                                    `section-${section.sectionId}`
                                                                }
                                                                onClick={
                                                                    () =>
                                                                        handleDeleteSection(
                                                                            section
                                                                        )
                                                                }
                                                            >

                                                                <LuTrash2 />

                                                            </button>

                                                        </div>

                                                    )}

                                                </div>


                                                <div className="edit-application-question-list">

                                                    {
                                                        activeQuestions.length >
                                                            0
                                                            ? (

                                                                activeQuestions.map(
                                                                    (
                                                                        question,
                                                                        questionIndex
                                                                    ) => (

                                                                        <div
                                                                            className="edit-application-question-row"
                                                                            key={
                                                                                question.questionId
                                                                            }
                                                                        >

                                                                            <div className="edit-application-question-number">

                                                                                {
                                                                                    questionIndex +
                                                                                    1
                                                                                }

                                                                            </div>


                                                                            <div className="edit-application-question-content">

                                                                                <p className="edit-application-question-text">
                                                                                    {
                                                                                        question.questionText
                                                                                    }
                                                                                </p>


                                                                                <div className="edit-application-question-meta">

                                                                                    <span>
                                                                                        {
                                                                                            formatQuestionType(
                                                                                                question.questionType
                                                                                            )
                                                                                        }
                                                                                    </span>


                                                                                    <span
                                                                                        className={
                                                                                            question.required
                                                                                                ? "question-required"
                                                                                                : ""
                                                                                        }
                                                                                    >

                                                                                        {
                                                                                            question.required
                                                                                                ? "Required"
                                                                                                : "Optional"
                                                                                        }

                                                                                    </span>


                                                                                    {
                                                                                        question.options
                                                                                            ?.length >
                                                                                        0
                                                                                        && (

                                                                                            <span>
                                                                                                {
                                                                                                    question.options.length
                                                                                                } options
                                                                                            </span>

                                                                                        )
                                                                                    }

                                                                                </div>

                                                                            </div>


                                                                            <div className="edit-application-question-actions">

                                                                                <button
                                                                                    type="button"
                                                                                    title="Edit question"
                                                                                    onClick={
                                                                                        () =>
                                                                                            openEditQuestion(
                                                                                                section,
                                                                                                question
                                                                                            )
                                                                                    }
                                                                                >

                                                                                    <LuPencil />

                                                                                </button>


                                                                                <button
                                                                                    type="button"
                                                                                    className="danger"
                                                                                    title="Delete question"
                                                                                    disabled={
                                                                                        busy ===
                                                                                        `question-${question.questionId}`
                                                                                    }
                                                                                    onClick={
                                                                                        () =>
                                                                                            handleDeleteQuestion(
                                                                                                question
                                                                                            )
                                                                                    }
                                                                                >

                                                                                    <LuTrash2 />

                                                                                </button>

                                                                            </div>

                                                                        </div>

                                                                    )
                                                                )

                                                            )

                                                            : (

                                                                <div className="edit-application-no-questions">

                                                                    No questions in this section yet.

                                                                </div>

                                                            )
                                                    }

                                                </div>


                                                <button
                                                    type="button"
                                                    className="edit-application-add-question-button"
                                                    onClick={
                                                        () =>
                                                            openCreateQuestion(
                                                                section
                                                            )
                                                    }
                                                >

                                                    <LuPlus />

                                                    Add Question

                                                </button>

                                            </article>

                                        );

                                    }
                                )
                        }

                    </div>


                    <button
                        type="button"
                        className="edit-application-add-section-button"
                        onClick={
                            openCreateSection
                        }
                    >

                        <LuPlus />

                        Add Another Section

                    </button>

                </section>

            )}


            {/* =================================================
                DIALOGS
            ================================================= */}

            {
                dialog?.type ===
                "role"
                && (

                    <RoleDialog
                        mode={
                            dialog.mode
                        }
                        role={
                            dialog.data
                        }
                        saving={
                            busy ===
                            "dialog"
                        }
                        onClose={
                            () =>
                                setDialog(null)
                        }
                        onSubmit={
                            handleRoleSubmit
                        }
                    />

                )
            }


            {
                dialog?.type ===
                "section"
                && (

                    <SectionDialog
                        mode={
                            dialog.mode
                        }
                        section={
                            dialog.data
                        }
                        roles={
                            roles
                        }
                        saving={
                            busy ===
                            "dialog"
                        }
                        onClose={
                            () =>
                                setDialog(null)
                        }
                        onSubmit={
                            handleSectionSubmit
                        }
                    />

                )
            }


            {
                dialog?.type ===
                "question"
                && (

                    <QuestionDialog
                        mode={
                            dialog.mode
                        }
                        question={
                            dialog.data
                        }
                        saving={
                            busy ===
                            "dialog"
                        }
                        onClose={
                            () =>
                                setDialog(null)
                        }
                        onSubmit={
                            handleQuestionSubmit
                        }
                    />

                )
            }
            <UnsavedChangesWarning
                when={
                    hasUnsavedChanges &&
                    !savingChanges
                }
                title="Leave application builder?"
                message="You have unsaved application form changes. Your changes will be lost if you leave this page."
            />
        </main>
    );
};


// =============================================================
// ROLE DIALOG
// =============================================================

const RoleDialog = ({
    mode,
    role,
    saving,
    onClose,
    onSubmit
}) => {

    const [name, setName] =
        useState(
            role?.name || ""
        );

    const [description, setDescription] =
        useState(
            role?.description || ""
        );


    const handleSubmit = (
        event
    ) => {

        event.preventDefault();


        onSubmit({
            name,
            description
        });
    };


    return (

        <DialogShell
            title={
                mode === "create"
                    ? "Add Officer Role"
                    : "Edit Officer Role"
            }
            onClose={
                onClose
            }
        >

            <form
                className="edit-application-dialog-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>

                    Role Name

                    <input
                        type="text"
                        value={
                            name
                        }
                        maxLength="255"
                        required
                        autoFocus
                        onChange={
                            event =>
                                setName(
                                    event.target.value
                                )
                        }
                    />

                </label>


                <label>

                    Description

                    <textarea
                        rows="4"
                        value={
                            description
                        }
                        maxLength="3000"
                        onChange={
                            event =>
                                setDescription(
                                    event.target.value
                                )
                        }
                    />

                </label>


                <DialogActions
                    saving={
                        saving
                    }
                    submitText={
                        mode === "create"
                            ? "Create Role"
                            : "Save Changes"
                    }
                    onCancel={
                        onClose
                    }
                />

            </form>

        </DialogShell>
    );
};


// =============================================================
// SECTION DIALOG
// =============================================================

const SectionDialog = ({
    mode,
    section,
    roles,
    saving,
    onClose,
    onSubmit
}) => {

    const [heading, setHeading] =
        useState(
            section?.sectionHeading ||
            ""
        );

    const [description, setDescription] =
        useState(
            section?.sectionDescription ||
            ""
        );

    const [roleIds, setRoleIds] =
        useState(
            section?.roleIds || []
        );


    const handleRoleCheckbox = (
        roleId,
        checked
    ) => {

        if (checked) {

            setRoleIds(
                previous => [
                    ...previous,
                    roleId
                ]
            );

        }
        else {

            setRoleIds(
                previous =>
                    previous.filter(
                        id =>
                            id !== roleId
                    )
            );

        }
    };


    const handleSubmit = (
        event
    ) => {

        event.preventDefault();


        onSubmit({
            sectionHeading:
                heading,

            sectionDescription:
                description,

            roleIds
        });
    };


    return (

        <DialogShell
            title={
                mode === "create"
                    ? "Add Section"
                    : "Edit Section"
            }
            onClose={
                onClose
            }
        >

            <form
                className="edit-application-dialog-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>

                    Section Heading

                    <input
                        type="text"
                        value={
                            heading
                        }
                        maxLength="255"
                        required
                        autoFocus
                        onChange={
                            event =>
                                setHeading(
                                    event.target.value
                                )
                        }
                    />

                </label>


                <label>

                    Description

                    <textarea
                        rows="4"
                        value={
                            description
                        }
                        maxLength="3000"
                        onChange={
                            event =>
                                setDescription(
                                    event.target.value
                                )
                        }
                    />

                </label>


                <div className="edit-application-dialog-field">

                    <p className="edit-application-dialog-field-label">

                        Use this section for

                        <span>
                            *
                        </span>

                    </p>


                    <div className="edit-application-role-checkboxes">

                        {roles.map(
                            role => (

                                <label
                                    className="edit-application-checkbox-option"
                                    key={
                                        role.applicationRoleId
                                    }
                                >

                                    <input
                                        type="checkbox"
                                        checked={
                                            roleIds.includes(
                                                role.applicationRoleId
                                            )
                                        }
                                        onChange={
                                            event =>
                                                handleRoleCheckbox(
                                                    role.applicationRoleId,
                                                    event.target.checked
                                                )
                                        }
                                    />

                                    <span>
                                        {role.name}
                                    </span>

                                </label>

                            )
                        )}

                    </div>

                </div>


                <DialogActions
                    saving={
                        saving
                    }
                    submitText={
                        mode === "create"
                            ? "Add Section"
                            : "Save Changes"
                    }
                    onCancel={
                        onClose
                    }
                />

            </form>

        </DialogShell>
    );
};


// =============================================================
// QUESTION DIALOG
// =============================================================

const QuestionDialog = ({
    mode,
    question,
    saving,
    onClose,
    onSubmit
}) => {

    const [questionText, setQuestionText] =
        useState(
            question?.questionText ||
            ""
        );

    const [questionType, setQuestionType] =
        useState(
            question?.questionType ||
            "short_text"
        );

    const [required, setRequired] =
        useState(
            question?.required ??
            true
        );

    const [options, setOptions] =
        useState(
            question?.options
                ?.map(
                    option =>
                        option.optionText
                )
            ||
            []
        );


    const choiceQuestion =
        questionType ===
        "single_choice"
        ||
        questionType ===
        "multiple_choice";


    const handleTypeChange = (
        value
    ) => {

        setQuestionType(value);


        const changingToChoice =
            value ===
            "single_choice"
            ||
            value ===
            "multiple_choice";


        if (
            changingToChoice &&
            options.length === 0
        ) {

            setOptions([
                "",
                ""
            ]);

        }


        if (!changingToChoice) {

            setOptions([]);

        }
    };


    const updateOption = (
        index,
        value
    ) => {

        setOptions(
            previous =>
                previous.map(
                    (
                        option,
                        currentIndex
                    ) =>
                        currentIndex ===
                            index
                            ? value
                            : option
                )
        );
    };


    const addOption = () => {

        setOptions(
            previous => [
                ...previous,
                ""
            ]
        );
    };


    const removeOption = (
        index
    ) => {

        setOptions(
            previous =>
                previous.filter(
                    (
                        _,
                        currentIndex
                    ) =>
                        currentIndex !==
                        index
                )
        );
    };


    const handleSubmit = (
        event
    ) => {

        event.preventDefault();


        const cleanedOptions =
            choiceQuestion
                ? options
                    .map(
                        option =>
                            option.trim()
                    )
                    .filter(
                        option =>
                            option.length >
                            0
                    )
                : [];


        onSubmit({
            questionText,
            questionType,
            required,
            options:
                cleanedOptions
        });
    };


    return (

        <DialogShell
            title={
                mode === "create"
                    ? "Add Question"
                    : "Edit Question"
            }
            subtitle={
                question?.sectionHeading
            }
            onClose={
                onClose
            }
        >

            <form
                className="edit-application-dialog-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>

                    Question

                    <textarea
                        rows="3"
                        value={
                            questionText
                        }
                        maxLength="2000"
                        required
                        autoFocus
                        onChange={
                            event =>
                                setQuestionText(
                                    event.target.value
                                )
                        }
                    />

                </label>


                <label>

                    Question Type

                    <select
                        value={
                            questionType
                        }
                        onChange={
                            event =>
                                handleTypeChange(
                                    event.target.value
                                )
                        }
                    >

                        {
                            QUESTION_TYPES.map(
                                type => (

                                    <option
                                        key={
                                            type.value
                                        }
                                        value={
                                            type.value
                                        }
                                    >
                                        {type.label}
                                    </option>

                                )
                            )
                        }

                    </select>

                </label>
                {choiceQuestion && (

                    <div className="edit-application-options-editor">

                        <div className="edit-application-options-editor-header">

                            <span>
                                Answer Options
                            </span>


                            <button
                                type="button"
                                onClick={
                                    addOption
                                }
                            >

                                <LuPlus />

                                Add Option

                            </button>

                        </div>


                        {options.map(
                            (
                                option,
                                index
                            ) => (

                                <div
                                    className="edit-application-option-editor-row"
                                    key={
                                        index
                                    }
                                >

                                    <span>
                                        {index + 1}
                                    </span>


                                    <input
                                        type="text"
                                        value={
                                            option
                                        }
                                        maxLength="500"
                                        placeholder={
                                            `Option ${index + 1}`
                                        }
                                        onChange={
                                            event =>
                                                updateOption(
                                                    index,
                                                    event.target.value
                                                )
                                        }
                                    />


                                    <button
                                        type="button"
                                        title="Remove option"
                                        onClick={
                                            () =>
                                                removeOption(
                                                    index
                                                )
                                        }
                                    >

                                        <LuTrash2 />

                                    </button>

                                </div>

                            )
                        )}

                    </div>

                )}

                <label className="edit-application-required-row">

                    <div>

                        <strong>
                            Required Question
                        </strong>

                        <p>
                            Applicants must answer this
                            question before submitting.
                        </p>

                    </div>


                    <label className="edit-application-switch edit-application-switch-small">

                        <input
                            type="checkbox"
                            checked={
                                required
                            }
                            onChange={
                                event =>
                                    setRequired(
                                        event.target.checked
                                    )
                            }
                        />

                        <span className="edit-application-switch-slider" />

                    </label>

                </label>





                <DialogActions
                    saving={
                        saving
                    }
                    submitText={
                        mode === "create"
                            ? "Add Question"
                            : "Save Changes"
                    }
                    onCancel={
                        onClose
                    }
                />

            </form>

        </DialogShell>
    );
};


// =============================================================
// DIALOG SHELL
// =============================================================

const DialogShell = ({
    title,
    subtitle,
    onClose,
    children
}) => {

    return (

        <div
            className="edit-application-dialog-backdrop"
            onMouseDown={
                event => {

                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }
            }
        >

            <div className="edit-application-dialog">

                <div className="edit-application-dialog-header">

                    <div>

                        <h2>
                            {title}
                        </h2>

                        {subtitle && (

                            <p>
                                {subtitle}
                            </p>

                        )}

                    </div>


                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        aria-label="Close dialog"
                    >

                        <LuX />

                    </button>

                </div>


                {children}

            </div>

        </div>
    );
};


// =============================================================
// DIALOG ACTIONS
// =============================================================

const DialogActions = ({
    saving,
    submitText,
    onCancel
}) => {

    return (

        <div className="edit-application-dialog-actions">

            <button
                type="button"
                className="edit-application-dialog-cancel"
                onClick={
                    onCancel
                }
            >

                Cancel

            </button>


            <button
                type="submit"
                className="edit-application-dialog-submit"
                disabled={
                    saving
                }
            >

                {
                    saving
                        ? "Saving..."
                        : submitText
                }

            </button>

        </div>
    );
};


const formatQuestionType = (
    type
) => {

    return QUESTION_TYPES.find(
        questionType =>
            questionType.value ===
            type
    )?.label || type;
};


export default EditApplicationForm;