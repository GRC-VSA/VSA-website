import { Outlet, useLocation } from "react-router-dom";
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
    const registationPage = ["/event"]

    const hideNavbar = authPages.includes(location.pathname);

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