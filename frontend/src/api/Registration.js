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

        let errorMessage = "Failed to submit registration.";
        try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            if (errorText) {
                errorMessage = errorText;
            }
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function verifyRegistration(eventId, verificationId, code) {
    const response = await fetch(`${BASE_URL}/${eventId}/registrations/verify`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ verificationId, code })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Registration verification failed.");
        console.error("Status:", response.status);
        console.error("Backend response:", errorText);

        throw new Error(errorText || "Failed to verify registration.");
    }
}

export async function resendVerificationCode(eventId, verificationId) {
    const response = await fetch(`${BASE_URL}/${eventId}/registrations/resend-code`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ verificationId })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Resend verification code failed.");
        console.error("Status:", response.status);
        console.error("Backend response:", errorText);

        throw new Error(errorText || "Failed to resend verification code.");
    }
}