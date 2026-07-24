import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [sid, setSid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");
      setErrorMessage("");

      await registerUser({
        sid,
        firstName,
        lastName,
        email,
        phone,
        passwordHash: password,
      });

      setMessage("Account created. Please verify your email before signing in.");

      setSid("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (error) {
      setErrorMessage(error.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <form className="register-form" onSubmit={handleSubmit}>
        <h1>Create account</h1>

        {message && <p className="register-success">{message}</p>}
        {errorMessage && <p className="register-error">{errorMessage}</p>}

        <label>
          Student ID
          <input
            type="text"
            value={sid}
            placeholder="Enter your student ID"
            onChange={(e) => setSid(e.target.value)}
            required
          />
        </label>

        <label>
          First name
          <input
            type="text"
            value={firstName}
            placeholder="Enter your first name"
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>

        <label>
          Last name
          <input
            type="text"
            value={lastName}
            placeholder="Enter your last name"
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            value={phone}
            placeholder="Enter your phone number"
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            placeholder="Create a password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/sign-in")}
        >
          Already have an account? Sign in
        </button>
      </form>
    </main>
  );
}

export default RegisterPage;