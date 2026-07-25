import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import "./AuthPages.css";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();

    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        const token = searchParams.get("token");

        if (!token) {
            setErrorMessage("Reset token is missing.");
            return;
        }
        
        try {
            setIsSubmitting(true);
            setMessage("");
            setErrorMessage("");

            await resetPassword({
                token,
                newPassword,
            });

            setMessage("Password reset successfully. You can now sign in.");
            setNewPassword("");
        } catch (error) {
            setErrorMessage(error.message || "Password reset failed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="reset-password-page">
            <form className="reset-password-form" onSubmit={handleSubmit}>
                <h1>Reset password</h1>

                {message && <p className="reset-password-success">{message}</p>}
                {errorMessage && <p className="reset-password-error">{errorMessage}</p>}

                <label>
                    New password
                    <div className="password-input-row">
                        <input type={showPassword ? "text" : "password"} value={newPassword} placeholder="Enter your new password" onChange={(e) => setNewPassword(e.target.value)} required/>

                        <button type="button" className="password-toggle-button" onClick={() => setShowPassword((current) => !current)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Resetting..." : "Reset password"}
                </button>

                <p className="reset-password-link-text">
                    Back to <Link to="/sign-in">sign in</Link>
                </p>
            </form>
        </main>
    );
}

export default ResetPasswordPage;