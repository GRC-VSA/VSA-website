import React, { useState } from "react";
import { registerUser } from "../api/auth.js";
import AuthToggle from "../components/AuthToggle.jsx";
import AuthPhotoPanel from "../components/AuthPhotoPanel.jsx";
import "./RegisterPage.css";
import "./AuthPages.css";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        sid: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEnterKey = (event) => {
        if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
            event.preventDefault();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage("");
            setErrorMessage("");

            await registerUser({
                sid: formData.sid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                passwordHash: formData.password,
            });

            setFormData({
                sid: "", firstName: "", lastName: "", email: "",
                phone: "", password: "", confirmPassword: "",
            });

            setMessage("Account created. Please check your email and click the verification link before signing in.");
        } catch (error) {
            console.error("Failed to register account: ", error);
            setErrorMessage(error.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-card order-photo-first">
                <AuthPhotoPanel />

                <div className="auth-form-panel">
                    <AuthToggle current="register" />

                    <h1>
                        Create <span>New Account</span>
                    </h1>
                    <p className="auth-tagline">Start Your Journey With VSA Here!</p>

                    {message && <p className="auth-success">{message}</p>}
                    {errorMessage && <p className="auth-error">{errorMessage}</p>}

                    <form className="auth-form" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
                        <div className="auth-form-row">
                            <label>
                                First Name
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </label>
                            <label>
                                Last Name
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </label>
                        </div>

                        <label>
                            Student ID
                            <input type="text" name="sid" value={formData.sid} onChange={handleChange} required />
                        </label>

                        <label>
                            Email
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </label>

                        <label>
                            Phone
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                        </label>

                        <label>
                            Password
                            <div className="password-input-div">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="show-password-button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <label>
                            Re-enter Password
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <div className="auth-divider-row">
                        <div className="auth-divider-line" />
                        <span className="auth-divider-text">Or register with</span>
                        <div className="auth-divider-line" />
                    </div>

                    <div className="auth-social-row">
                        <button type="button" className="auth-social-btn" aria-label="Continue with Facebook"><FacebookIcon /></button>
                        <button type="button" className="auth-social-btn" aria-label="Continue with Google"><GoogleIcon /></button>
                        <button type="button" className="auth-social-btn" aria-label="Continue with X"><XIcon /></button>
                    </div>
                </div>
            </div>
        </main>
    );
};

function FacebookIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99h-2.54V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z" />
        </svg>
    );
}
function GoogleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z"/>
            <path fill="#FBBC05" d="M5.84 13.9A6.6 6.6 0 015.5 12c0-.66.12-1.3.34-1.9V7.25H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.95l3.66-2.85z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.25l3.66 2.85c.87-2.6 3.3-4.72 6.16-4.72z"/>
        </svg>
    );
}
function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
            <path d="M18.9 2H22l-7.6 8.67L23.3 22h-7.1l-5.56-6.63L4.1 22H1l8.13-9.28L.9 2h7.28l5.03 6.06L18.9 2zm-1.24 18h1.96L6.4 4h-2l13.26 16z"/>
        </svg>
    );
}

export default RegisterPage;