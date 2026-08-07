import { useState } from "react";
import { Link } from "react-router-dom";
import VSA_coloredlogo from "../assets/guest/VSA_coloredlogo.png";

// Import your cover photos
import cover1 from "../assets/guest/Auth/BeggingLoginPageCover.png";
import cover2 from "../assets/guest/Auth/CheatingLoginPageCover.png";
import cover3 from "../assets/guest/Auth/SleepingLoginPageCover.png";
import cover4 from "../assets/guest/Auth/TinRegisterPageCover.png";

const coverPhotos = [cover1, cover2, cover3, cover4];

const AuthPhotoPanel = ({ altText = "VSA Cover Photo" }) => {
    // Pick the random photo synchronously on state initialization
    const [selectedPhoto] = useState(() => {
        const randomIndex = Math.floor(Math.random() * coverPhotos.length);
        return coverPhotos[randomIndex];
    });

    return (
        <div className="auth-photo-panel">
            {selectedPhoto ? (
                <img src={selectedPhoto} alt={altText} className="auth-photo" />
            ) : (
                <div className="auth-photo-placeholder">
                    <span>Photo</span>
                </div>
            )}

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