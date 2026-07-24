import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import "./GuestLayout.css"

const GuestLayout = () => {
    return (
        <>
            <NavBar/>
            <main id="guest-main">
                <Outlet/>
            </main>
        </>
    );
};

export default GuestLayout;

