import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { verifyRegistration, resendVerificationCode } from "../api/Registration.js";
import "./RegistrationVerificationPage.css";

const RegistrationVerificationPage = () => {
    const { eventId, verificationId } = useParams();
    const location = useLocation();
    const email = location.state?.email;
    const expiresAt = location.state?.expiresAt;

    const [code, setCode] = useState("");
    const [resendCooldown, setResendCooldown] = useState(60);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleCodeChange = (event) => {
        const formattedCode = event.target.value
            .toUpperCase()
            .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
            .slice(0, 8);

        setCode(formattedCode);

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (code.length !== 8) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            await verifyRegistration(eventId, verificationId, code);

            setVerified(true);
        } catch (err) {
            console.error("Registration verification failed:", err);

            setError("The verification code is incorrect or expired.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || resending) {
            return;
        }

        try {
            setResending(true);
            setResendMessage("");
            setError("");

            await resendVerificationCode(
                eventId,
                verificationId
            );

            setResendCooldown(60);
            setResendMessage("A new verification code has been sent.");
        } catch (err) {
            console.error("Failed to resend verification code:", err);

            setResendMessage("Unable to resend the verification code. Please try again later.");
        } finally {
            setResending(false);
        }
    };

    if (verified) {
        return (
            <main className="registration-verification-page">
                <h1>Registration successful!</h1>
                <p>
                    Your student email has been verified and
                    your registration is confirmed.
                </p>
            </main>
        );
    }

    return (
        <main className="registration-verification-page">
            <h1>Check your student email</h1>
            <p>
                We sent a verification code
                {email && (
                    <>
                        {" "}to <strong>{email}</strong>
                    </>
                )}
                .
            </p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    minLength={8}
                    maxLength={8}
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="XXXXXXXX"
                    onChange={handleCodeChange}
                />

                {error && (<p className="verification-error">{error}</p>)}

                <button type="submit" disabled={code.length !== 8 || loading}>
                    {loading ? "Verifying..." : "Verify"}
                </button>

                <div className="verification-resend">
                    <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || resending}>
                        {resending
                            ? "Sending..."
                            : resendCooldown > 0
                                ? `Resend code in ${resendCooldown}s`
                                : "Resend code"
                        }
                    </button>

                    {resendMessage && (<p className="verification-resend-message">{resendMessage}</p>)}
                </div>
            </form>
        </main>
    );
};

export default RegistrationVerificationPage;