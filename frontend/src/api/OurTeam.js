import { getTokenforAuthHeader } from "./authHeaders.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function getOurTeam() {
    const response = await fetch(`${API_BASE_URL}/api/our-team`);

    if (!response.ok) {
        throw new Error("Failed to fetch officers.");
    }

    return response.json();
}

export async function getOurTeamByGeneration(generation) {
    const response = await fetch(
        `${API_BASE_URL}/api/our-team?generation=${generation}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch officers.");
    }

    return response.json();
}

export async function createOfficer(officerData, image) {
    const formData = new FormData();

    const officerBlob = new Blob(
        [JSON.stringify(officerData)],
        {
            type: "application/json"
        }
    );

    formData.append("officer", officerBlob);
    formData.append("image", image);

    const response = await fetch(
        `${API_BASE_URL}/api/our-team`,
        {
            method: "POST",
            headers: {
                ...getTokenforAuthHeader()
            },
            body: formData
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            errorText || "Failed to create officer."
        );
    }

    return response.json();
}

export async function deleteOfficer(ourTeamId) {
    const response = await fetch(
        `${API_BASE_URL}/api/our-team/${ourTeamId}`,
        {
            method: "DELETE",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete officer.");
    }
}