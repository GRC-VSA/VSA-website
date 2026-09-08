import { Outlet, useLocation, matchPath } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "./GuestLayout.css";

const GuestLayout = () => {
    const location = useLocation();

    const authPages = [
        "/sign-in",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify",
    ];
    
    const isRegistrationPage = matchPath("/events/:eventId/registration-form", location.pathname);
    const isRegistrationVerificationPage = matchPath("/events/:eventId/registration/verify/:verificationId", location.pathname);

    const noNavbar = authPages.includes(location.pathname);
    const hideNavbar = isRegistrationPage || noNavbar || isRegistrationVerificationPage;
    return (
        <>
            {!hideNavbar && <Navbar />}

            <main id="guest-main">
                <Outlet />
            </main>

            {!hideNavbar && <Footer />}
        </>
    );
};

export default GuestLayout;