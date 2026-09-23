import { getTokenforAuthHeader } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function getCurrentUserProfile() {
    const response = await fetch(`${API_BASE_URL}/api/users/me`,
        {
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to load user profile.");
    }

    return response.json();
}


async function getErrorMessage(response, fallbackMessage) {
    try {
        const data = await response.json();
        return data.message || fallbackMessage;
    }
    catch {
        return fallbackMessage;
    }
}


export async function updateCurrentUserProfile(profile) {
    const response = await fetch(`${API_BASE_URL}/api/users/me`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                ...getTokenforAuthHeader()
            },

            body: JSON.stringify(profile)
        }
    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to update profile."));
    }

    return response.json();
}


export async function uploadCurrentUserAvatar(image) {
    const formData = new FormData();

    formData.append("image", image);

    const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`,
        {
            method: "POST",

            headers: {
                ...getTokenforAuthHeader()
            },

            body: formData
        }
    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to upload profile image."));
    }

    return response.json();
}


export async function removeCurrentUserAvatar() {
    const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`,
        {
            method: "DELETE",

            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response,"Failed to remove profile image."));
    }

    return response.json();
}