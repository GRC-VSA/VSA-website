import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthPages.css";

const SignInPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            const user = await login({email, password});
            if (user.role === "officer" || user.role === "president") {
                navigate("/officer");
            }
            else {
                navigate("/");
            }
        } catch (error) {
            setErrorMessage(
                error.message || "Invalid email/password, or your email is not verified yet lil bro."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="sign-in-page">
            <form className="sign-in-form" onSubmit={handleSubmit}>
                <h1>Sign in</h1>

                {errorMessage && <p className="sign-in-error">{errorMessage}</p>}

                <label>
                    Email
                    <input type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required/>
                </label>

                <label>
                    Password
                    <div className="password-input-row">
                        <input type={showPassword ? "text" : "password"} value={password} placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} required/>

                        <button type="button" className="password-toggle-button" onClick={() => setShowPassword((current) => !current)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </label>

                <Link to="/forgot-password" className="forgot-password-link">
                    Forgot password?
                </Link>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <p className="sign-in-link-text">
                    Need an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </main>
    );
}

export default SignInPage;

