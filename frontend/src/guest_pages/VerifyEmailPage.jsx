import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmailCode, resendVerificationCode } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

const CODE_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 60; // matches the backend's cooldown

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    // RegisterPage passes these through router state after a successful signup.
    const passedState = location.state || {};

    const [verificationId, setVerificationId] = useState(passedState.verificationId || "");
    const [maskedEmail, setMaskedEmail] = useState(passedState.maskedEmail || "");
    // Kept so "resend" works -- the backend's resend endpoint is keyed by email,
    // not by verificationId.
    const [email, setEmail] = useState(passedState.email || "");

    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [cooldown, setCooldown] = useState(0);

    // If the user refreshed this page, router state is gone and we have no
    // verificationId. Rather than dead-ending them, ask for the email and get a
    // fresh code -- which is also the escape hatch for someone who closed the
    // tab days ago.
    const needsRecovery = !verificationId;

    const codeInputRef = useRef(null);

    useEffect(() => {
        if (!needsRecovery && codeInputRef.current) {
            codeInputRef.current.focus();
        }
    }, [needsRecovery]);

    // Tick the resend cooldown down to zero.
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleCodeChange = (event) => {
        // The backend's alphabet is uppercase and excludes I, O, 0 and 1, so
        // uppercase as they type and drop anything that can't be part of a code.
        const cleaned = event.target.value
            .toUpperCase()
            .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
            .slice(0, CODE_LENGTH);

        setCode(cleaned);
    };

    const handleVerify = async (event) => {
        event.preventDefault();

        if (code.length !== CODE_LENGTH) {
            setErrorMessage(`Please enter all ${CODE_LENGTH} characters.`);
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setMessage("");

            const { token } = await verifyEmailCode({ verificationId, code });

            if (!token || typeof token !== "string") {
                throw new Error("Email verification failed.");
            }

            // Verification returns a JWT, so the user is already signed in --
            // route it through AuthContext so token/user state stay in sync.
            loginWithToken(token);

            navigate("/", { replace: true });
        } catch (error) {
            console.error("Failed to verify email: ", error);
            setErrorMessage(error.message || "Email verification failed.");
            setCode("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async (event) => {
        event.preventDefault();

        if (!email.trim()) {
            setErrorMessage("Enter the email you signed up with.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setMessage("");

            const result = await resendVerificationCode(email.trim());

            // Always take the new verificationId -- the previous one is dead.
            setVerificationId(result.verificationId);
            setMaskedEmail(result.maskedEmail);
            setCode("");
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setMessage("A new code is on its way. Check your inbox.");
        } catch (error) {
            console.error("Failed to resend verification code: ", error);
            setErrorMessage(error.message || "Could not send a new code.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="verify-email-page">
            <section className="verify-email-card">
                <h1>Verify Your Email</h1>

                {needsRecovery ? (
                    <>
                        <p className="verify-message">
                            Enter the email you signed up with and we'll send you a new
                            verification code.
                        </p>

                        <form className="auth-form" onSubmit={handleResend}>
                            <label>
                                Email
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </label>

                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send me a code"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="verify-message">
                            We sent a {CODE_LENGTH}-character code to{" "}
                            <strong>{maskedEmail || "your email"}</strong>. Enter it below to
                            finish creating your account.
                        </p>

                        <form className="auth-form" onSubmit={handleVerify}>
                            <label>
                                Verification code
                                <input
                                    ref={codeInputRef}
                                    type="text"
                                    name="code"
                                    className="verify-code-input"
                                    value={code}
                                    onChange={handleCodeChange}
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    autoCapitalize="characters"
                                    spellCheck="false"
                                    maxLength={CODE_LENGTH}
                                    required
                                />
                            </label>

                            <button type="submit" disabled={isSubmitting || code.length !== CODE_LENGTH}>
                                {isSubmitting ? "Verifying..." : "Verify and continue"}
                            </button>
                        </form>

                        <button
                            type="button"
                            className="verify-resend-button"
                            onClick={handleResend}
                            disabled={isSubmitting || cooldown > 0}
                        >
                            {cooldown > 0
                                ? `Resend code in ${cooldown}s`
                                : "Didn't get it? Send a new code"}
                        </button>
                    </>
                )}

                {message && <p className="verify-success">{message}</p>}
                {errorMessage && <p className="auth-error">{errorMessage}</p>}

                <Link to="/sign-in" className="verify-link">
                    Back to sign in
                </Link>
            </section>
        </main>
    );
};

export default VerifyEmailPage;