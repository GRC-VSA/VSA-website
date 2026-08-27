import { API_BASE_URL } from "./config.js";

const BASE_URL = `${API_BASE_URL}/api/events`;


export async function getRegistrationForm(eventId) {
    const response = await fetch(`${BASE_URL}/${eventId}/registrations/form`);

    if (!response.ok) {
        throw new Error("Failed to fetch registration form.");
    }

    return response.json();
}

export async function submitRegistration(eventId, registrationData) {
    const response = await fetch(`${BASE_URL}/${eventId}/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Submit registration failed.");
        console.error("Status:", response.status);
        console.error("Backend response:", errorText);
        console.error("Payload sent:", registrationData);

        throw new Error("Failed to submit registration.");
    }

    return response.json();
}