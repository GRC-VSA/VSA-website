// src/pages/SignInPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthToggle from "../components/AuthToggle.jsx";
import AuthPhotoPanel from "../components/AuthPhotoPanel.jsx";
import "./AuthPages.css"

const SignInPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user = await login({ email: form.email, password: form.password });
            navigate(user.role === "officer" || user.role === "president" ? "/officer" : "/");
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
                    <p className="auth-tagline">What legacy are we leaving!</p>

                    {error && <p className="auth-error">{error}</p>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </label>

                        <label>
                            Password
                            <input type="password" name="password" value={form.password} onChange={handleChange} required />
                        </label>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                            <Link to="/forgot-password" style={{ fontSize: "0.8rem", color: "#888", textDecoration: "none" }}>
                                Forgot your password?
                            </Link>
                        </div>

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
        </div>
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

export default SignInPage;