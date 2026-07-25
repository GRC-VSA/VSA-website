import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./GuestLayout.css"

const GuestLayout = () => {
    return (
        <>
            <Navbar/>
            <main id="guest-main">
                <Outlet/>
            </main>
        </>
    );
};

export default GuestLayout;

