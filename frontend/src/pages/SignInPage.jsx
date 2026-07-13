import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./SignInPage.css";

const SignInPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            await login({ email, password });

            navigate("/home"); //Change the page to "/home" once login is successful.
        }
        catch (error) {
            setErrorMessage("Invalid email/password, or your email is not verified yet."); /// <--------- ADD BETTER UI HERE.
        }
        finally {
            setIsSubmitting(false);
        }
    }

    return (
    <main className="sign-in-page">
        <form className="sign-in-form" onSubmit={handleSubmit}>
        <h1>Sign in</h1>

        {errorMessage && <p className="sign-in-error">{errorMessage}</p>}

        <label> Email
            <input type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required/>
        </label>

        <label> Password 
            <input type="password" value={password} placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} required/>
        </label>

        <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default SignInPage;