import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailToken } from "../api/auth";
import "./AuthPages.css";

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Verifying your email...");
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        async function verifyEmail() {
            const token = searchParams.get("token");

            if (!token) {
                setMessage("Verification token is missing.");
                setIsSuccess(false);
                return;
            }

            try {
                await verifyEmailToken(token);
                setMessage("Your email has been verified. You can now sign in.");
                setIsSuccess(true);
            } catch (error) {
                setMessage(error.message || "Email verification failed.");
                setIsSuccess(false);
            }
        }
        verifyEmail();
    }, [searchParams]);

    return (
        <main className="verify-email-page">
            <section className="verify-email-card">
                <h1>Email Verification</h1>

                <p className={isSuccess ? "verify-success" : "verify-message"}>
                    {message}
                </p>

                <Link to="/sign-in" className="verify-link">
                    Go to sign in
                </Link>
            </section>
        </main>
    );
}

export default VerifyEmailPage;