import { getTokenforAuthHeader } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";


async function getErrorMessage(response, fallbackMessage) {
    try {
        const data = await response.json();
        return data.message || fallbackMessage;
    }
    catch {
        return fallbackMessage;
    }
}


// PUBLIC
export async function getRecruitmentStatus() {
    const response = await fetch(`${API_BASE_URL}/api/application-roles/recruitment-status`);

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to fetch recruitment status."));
    }
    return response.json();
}


export async function getOpenApplicationRoles() {
    const response = await fetch(`${API_BASE_URL}/api/application-roles/open`);

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to fetch open application roles."));
    }

    return response.json();
}


// STUDENT APPLY

export async function startApplication(applicationRoleId) {
    const response = await fetch(`${API_BASE_URL}/api/applications/start/${applicationRoleId}`,
        {
            method: "POST",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, "Failed to start application.")
        );
    }

    return response.json();
}


export async function getMyApplications() {
    const response = await fetch(`${API_BASE_URL}/api/applications/mine`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, "Failed to fetch your applications.")
        );
    }

    return response.json();
}


export async function getMyApplication(applicationId) {
    const response = await fetch(`${API_BASE_URL}/api/applications/mine/${applicationId}`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, "Failed to fetch application.")
        );
    }

    return response.json();
}


export async function saveApplication(applicationId, answers) {
    const response = await fetch(`${API_BASE_URL}/api/applications/mine/${applicationId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                answers
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, "Failed to save application.")
        );
    }

    return response.json();
}


export async function submitApplication(applicationId, answers) {
    const response = await fetch(`${API_BASE_URL}/api/applications/mine/${applicationId}/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                answers
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, "Failed to submit application.")
        );
    }

    return response.json();
}

// =========================================================
// OFFICER - RECRUITMENT
// =========================================================

export async function setRecruitmentStatus(recruitmentOpen) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/recruitment-status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                recruitmentOpen
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update recruitment status."
            )
        );
    }

    return response.json();
}


// =========================================================
// OFFICER - ROLES
// =========================================================

export async function getApplicationRoles() {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to fetch application roles."
            )
        );
    }

    return response.json();
}


export async function createApplicationRole(name, description) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                name,
                description
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to create application role."
            )
        );
    }

    return response.json();
}


export async function updateApplicationRole(
    applicationRoleId,
    name,
    description
) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/${applicationRoleId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                name,
                description
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update application role."
            )
        );
    }

    return response.json();
}


export async function setRoleRecruiting(
    applicationRoleId,
    recruiting
) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/${applicationRoleId}/recruiting`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                recruiting
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update role recruitment status."
            )
        );
    }

    return response.json();
}


export async function deleteApplicationRole(applicationRoleId) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/${applicationRoleId}`,
        {
            method: "DELETE",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to delete application role."
            )
        );
    }
}


// =========================================================
// OFFICER - SECTIONS
// =========================================================

export async function createApplicationSection({
    sectionHeading,
    sectionDescription,
    roleIds
}) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/sections`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                sectionHeading,
                sectionDescription,
                roleIds
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to create application section."
            )
        );
    }

    return response.json();
}


export async function updateApplicationSection(
    sectionId,
    {
        sectionHeading,
        sectionDescription,
        roleIds
    }
) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/sections/${sectionId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                sectionHeading,
                sectionDescription,
                roleIds
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update application section."
            )
        );
    }

    return response.json();
}


export async function deleteApplicationSection(sectionId) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/sections/${sectionId}`,
        {
            method: "DELETE",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to delete application section."
            )
        );
    }
}


// =========================================================
// OFFICER - QUESTIONS
// =========================================================

export async function createApplicationQuestion(
    sectionId,
    {
        questionText,
        questionType,
        required,
        options
    }
) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/sections/${sectionId}/questions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                questionText,
                questionType,
                required,
                options
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to create application question."
            )
        );
    }

    return response.json();
}


export async function updateApplicationQuestion(
    questionId,
    {
        questionText,
        questionType,
        required,
        options
    }
) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/questions/${questionId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },
            body: JSON.stringify({
                questionText,
                questionType,
                required,
                options
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update application question."
            )
        );
    }

    return response.json();
}


export async function deleteApplicationQuestion(questionId) {
    const response = await fetch(
        `${API_BASE_URL}/api/application-roles/questions/${questionId}`,
        {
            method: "DELETE",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to delete application question."
            )
        );
    }
}

export async function saveApplicationBuilder(payload) {

    const response = await fetch(
        "/api/application-roles/builder",
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },

            body: JSON.stringify(payload)
        }
    );


    if (!response.ok) {

        const responseText =
            await response.text();

        let message =
            "Failed to save application form changes.";


        if (responseText) {

            try {

                const data =
                    JSON.parse(responseText);

                message =
                    data.message ||
                    data.error ||
                    message;

            }
            catch {

                message =
                    responseText;
            }
        }


        throw new Error(message);
    }


    return response.json();
}

export async function getApplicationOverview() {

    const response = await fetch(
        `${API_BASE_URL}/api/applications/overview`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to fetch application overview."
            )
        );
    }

    return response.json();
}


export async function getCompletedApplications() {

    const response = await fetch(`${API_BASE_URL}/api/applications?status=COMPLETED`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to fetch submitted applications."
            )
        );
    }

    return response.json();
}

export async function getSubmittedApplicationReview(applicationId) {

    const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/review`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to fetch application."));
    }
    return response.json();
}