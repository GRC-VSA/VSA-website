import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/auth.js";
import "./AuthPages.css";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        sid: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleEnterKey = (event) => {
        if (event.key === "Enter") {
            if (event.target.tagName === "TEXTAREA") {
                return;
            } else {
                event.preventDefault();
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

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

            console.log("Account created successfully.");

            setFormData({
                sid: "",
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                password: "",
            });

            setMessage(
                "Account created. Please check your email and click the verification link before signing in."
            );
        } catch (error) {
            console.error("Failed to register account: ", error);
            setErrorMessage(error.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="register-page">
            <form className="register-form" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
                <h1>Create Account</h1>

                {message && <p className="register-success">{message}</p>}
                {errorMessage && <p className="register-error">{errorMessage}</p>}

                <label>
                    Student ID
                    <input type="text" name="sid" value={formData.sid} placeholder="Enter your student ID" onChange={handleChange} required/>
                </label>

                <label>
                    First Name
                    <input type="text" name="firstName" value={formData.firstName} placeholder="Enter your first name" onChange={handleChange} required/>
                </label>

                <label>
                    Last Name
                    <input type="text" name="lastName" value={formData.lastName} placeholder="Enter your last name" onChange={handleChange} required/>
                </label>

                <label>
                    Email
                    <input type="email" name="email" value={formData.email} placeholder="Enter your email" onChange={handleChange} required/>
                </label>

                <label>
                    Phone
                    <input type="tel" name="phone" value={formData.phone} placeholder="Enter your phone number" onChange={handleChange}/>
                </label>

                <label>
                    Password
                    <div className="password-input-div">
                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder="Create a password" onChange={handleChange} required/>

                        <button type="button" className="show-password-button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create Account"}
                </button>

                <p className="register-link-text">
                    Already have an account? <Link to="/sign-in">Sign in</Link>
                </p>

            </form>
        </main>
    );
};

export default RegisterPage;