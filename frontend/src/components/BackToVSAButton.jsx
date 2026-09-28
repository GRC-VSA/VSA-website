import { useLocation, useNavigate } from "react-router-dom";
import "./BackToVSAButton.css";
const BackToVSAButton = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {

        const previousPage =
            location.state?.from;
        /*
         * Only allow internal VSA paths.
         *
         * If there is no saved previous page,
         * the user probably accessed /apply directly.
         */
        const destination = typeof previousPage === "string" && previousPage.startsWith("/") && !previousPage.startsWith("//")
            ? previousPage
            : "/";

        navigate(destination);
    };


    return (
        <button type="button" className="back-to-vsa-button" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#AB3130"><path d="m480-320 56-56-64-64h168v-80H472l64-64-56-56-160 160 160 160Zm0 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
            Back to VSA Website</button>
    );

};

export default BackToVSAButton;