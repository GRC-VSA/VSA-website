import { useNavigate } from "react-router-dom";
import { navigateWithTransition } from "../utils/viewTransition.js";

const AuthToggle = ({ current }) => {
    const navigate = useNavigate();

    return (
        <div className="auth-toggle-row">
            <div className="auth-toggle-wrap">
                <button
                    type="button"
                    className={current === "register" ? "active" : ""}
                    onClick={() => current !== "register" && navigateWithTransition(navigate, "/register")}
                >
                    Register
                </button>
                <button
                    type="button"
                    className={current === "signin" ? "active" : ""}
                    onClick={() => current !== "signin" && navigateWithTransition(navigate, "/sign-in")}
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default AuthToggle;