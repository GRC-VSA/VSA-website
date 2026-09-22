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