import { getTokenforAuthHeader } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";


export async function getSponsors() {
    const response = await fetch(`${API_BASE_URL}/api/sponsors`);

    if (!response.ok) {
        throw new Error("Failed to fetch sponsors.");
    }

    return response.json();
}


export async function createSponsor(sponsorData, image) {
    const formData = new FormData();

    const sponsorBlob = new Blob(
        [JSON.stringify(sponsorData)],
        {
            type: "application/json"
        }
    );

    formData.append("sponsor", sponsorBlob);
    formData.append("image", image);

    const response = await fetch(
        `${API_BASE_URL}/api/sponsors`,
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

        throw new Error(errorText || "Failed to create sponsor.");
    }

    return response.json();
}


export async function deleteSponsor(sponsorId) {
    const response = await fetch(`${API_BASE_URL}/api/sponsors/${sponsorId}`,
        {
            method: "DELETE",
            headers: {
                ...getTokenforAuthHeader()
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete sponsor.");
    }
}