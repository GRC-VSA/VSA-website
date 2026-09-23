// src/pages/SignInPage.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthToggle from "../components/AuthToggle.jsx";
import AuthPhotoPanel from "../components/AuthPhotoPanel.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { replaceLocation } from "../utils/navigation.js";

import "./AuthPages.css"

const SignInPage = () => {

    useDocumentTitle("Sign in")
    // const navigate = useNavigate();
    // const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user = await login({ email: form.email, password: form.password });
            if (user.role === "officer" || user.role === "president") {
                replaceLocation("/officer");
                return;
            }
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect");

            if (redirect) {
                window.location.replace(redirect);
                return;
            }

            replaceLocation("/");

        } catch (err) {
            setError(err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="auth-page">

            <div className="auth-card order-photo-last">
                <AuthPhotoPanel />
                <div className="auth-form-panel">
                    <AuthToggle current="signin" />
                    <h1>
                        Welcome <span>back!</span>
                    </h1>
                    <p className="auth-tagline">What a legacy we are leaving behind!</p>


                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </label>

                        <div className="auth-password-field">
                            <label htmlFor="signin-password">Password</label>

                            <div className="auth-password-input">
                                <input
                                    id="signin-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />

                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                    onClick={() => setShowPassword((visible) => !visible)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"  fill="currentColor" aria-hidden="true">
                                        {/* Add one diagonal slash to the eye. Kind peak */}
                                        {showPassword ? (
                                            <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
                                        ) : (
                                            <path d="M607.5-372.5Q660-425 660-500t-52.5-127.5Q555-680 480-680t-127.5 52.5Q300-575 300-500t52.5 127.5Q405-320 480-320t127.5-52.5Zm-204-51Q372-455 372-500t31.5-76.5Q435-608 480-608t76.5 31.5Q588-545 588-500t-31.5 76.5Q525-392 480-392t-76.5-31.5ZM214-281.5Q94-363 40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200q-146 0-266-81.5ZM480-500Zm207.5 160.5Q782-399 832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280q113 0 207.5-59.5Z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                            <Link to="/forgot-password" style={{ fontSize: "0.8rem", color: "#888", textDecoration: "none" }}>
                                Forgot your password?
                            </Link>
                        </div>
                        {error && <p className="auth-error">{error}</p>}

                        <button type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className="auth-divider-row">
                        <div className="auth-divider-line" />
                        <span className="auth-divider-text">Or sign in with</span>
                        <div className="auth-divider-line" />
                    </div>

                    <div className="auth-social-row">
                        <button type="button" className="auth-social-btn" aria-label="Continue with Facebook"><FacebookIcon /></button>
                        <button type="button" className="auth-social-btn" aria-label="Continue with Google"><GoogleIcon /></button>
                        <button type="button" className="auth-social-btn" aria-label="Continue with X"><XIcon /></button>
                    </div>
                </div>
            </div>
        </div >
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 13.9A6.6 6.6 0 015.5 12c0-.66.12-1.3.34-1.9V7.25H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.95l3.66-2.85z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.25l3.66 2.85c.87-2.6 3.3-4.72 6.16-4.72z" />
        </svg>
    );
}
function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
            <path d="M18.9 2H22l-7.6 8.67L23.3 22h-7.1l-5.56-6.63L4.1 22H1l8.13-9.28L.9 2h7.28l5.03 6.06L18.9 2zm-1.24 18h1.96L6.4 4h-2l13.26 16z" />
        </svg>
    );
}

export default SignInPage;