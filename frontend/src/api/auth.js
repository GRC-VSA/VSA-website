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

/*******************************************************************************************************************
 Brief:
 - Creates the account and asks the backend to email a verification code.
 - Returns { verificationId, maskedEmail, expiresAt } -- NOT the created user.

 Note:
 - The account exists at this point but cannot log in until the code is verified.
 - Hold on to verificationId: it is what identifies this verification attempt when
 the user submits their code.
 **********************************************************************************************************************/
export async function registerUser(registerData) {
    const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
    }

    return res.json();
}

/*******************************************************************************************************************
 Brief:
 - Submits the code the user typed in from their verification email.
 - Returns { token, message } -- the token logs them straight in, so there is no
 need to send them back to the sign-in page afterwards.
 **********************************************************************************************************************/
export async function verifyEmailCode({ verificationId, code }) {
    const res = await fetch(`${API_BASE_URL}/api/users/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            verificationId,
            code,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Email verification failed");
    }

    return res.json();
}

/*******************************************************************************************************************
 Brief:
 - Asks for a fresh verification code for a pending (unverified) account.
 - Keyed by email rather than verificationId on purpose: this exists for the user
 who closed the tab and no longer has a verificationId to send.
 - Returns { verificationId, maskedEmail, expiresAt } -- always replace the
 verificationId you were holding with this one.
 **********************************************************************************************************************/
export async function resendVerificationCode(email) {
    const res = await fetch(`${API_BASE_URL}/api/users/resend-verification`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Could not send a new code");
    }

    return res.json();
}

export async function sendForgotPasswordEmail(email) {
    const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to send reset email");
    }

    return res.text();
}

export async function resetPassword({ token, newPassword }) {
    const res = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token,
            newPassword
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Password reset failed");
    }

    return res.text();
}