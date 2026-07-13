import { API_BASE_URL } from "./config";

export async function loginUser({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Login failed");
    }

    return res.json();
}