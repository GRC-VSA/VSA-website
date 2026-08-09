import { useState } from "react";
import { Link } from "react-router-dom";
import { sendForgotPasswordEmail } from "../api/auth.js";
import "./AuthPages.css";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");
            setErrorMessage("");

            await sendForgotPasswordEmail(email);

            setMessage("Password reset email sent. Please check your inbox.");
            setEmail("");
        } catch (error) {
            setErrorMessage(error.message || "Failed to send password reset email.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="forgot-password-page">
            <form className="forgot-password-form" onSubmit={handleSubmit}>
                <h1>Forgot password</h1>

                <p className="forgot-password-description">
                    Enter your email and a password reset link will be sent to you, lil bro.
                </p>

                {message && <p className="forgot-password-success">{message}</p>}
                {errorMessage && <p className="forgot-password-error">{errorMessage}</p>}

                <label>
                    Email
                    <input type="email" value={email} placeholder="Enter your account email" onChange={(e) => setEmail(e.target.value)} required/>
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send reset link"}
                </button>

                <p className="forgot-password-link-text">
                    Remember your password? <Link to="/sign-in">Sign in</Link>
                </p>
            </form>
        </main>
    );
}

export default ForgotPasswordPage;