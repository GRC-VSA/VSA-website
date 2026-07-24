import { API_BASE_URL } from "./config";

//Post
/*******************************************************************************************************************
Brief:
- This function needs 2 parameters: email & password
- It sends the email and password of the user input to backend through the API "/api/users/login",
- and receives and also returns the JWT token for the account from backend.

Usage:
- This function is used right when the user logs in
- It is called by the "login" method in "../context/AuthContext.jsx"
- This function returns the JWT token and the "login" method will decode that token and store it in localStorage
- The login method is, then, called when the user hit "login" in button in "../pages/SignInPage.jsx"

**********************************************************************************************************************/
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

export async function registerUser({
    sid,
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
}) {
    const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sid,
            firstName,
            lastName,
            email,
            phone,
            passwordHash,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
    }

    return res.json();
}