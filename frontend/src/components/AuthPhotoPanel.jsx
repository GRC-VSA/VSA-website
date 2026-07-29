import { Link } from "react-router-dom";
import VSA_coloredlogo from "../assets/guest/VSA_coloredlogo.png";

const AuthPhotoPanel = () => {
    return (
        <div className="auth-photo-panel">
            <div className="auth-photo-placeholder">
                <span>Photo</span>
            </div>

            <div className="auth-photo-overlay" />

            <Link to="/" className="auth-logo-link">
                <img
                    src={VSA_coloredlogo}
                    alt="VSA Logo"
                    className="auth-logo-image"
                />
            </Link>
        </div>
    );
};

export default AuthPhotoPanel;