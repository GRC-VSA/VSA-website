import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./OfficerNavBar.css";
import VSA_blacklogo from "../assets/officer/VSA_blacklogo.png"
import VSA_redlogo from "../assets/officer/VSA_redlogo.png"

const OfficerNavBar = () => {
    const [sidebarClosed, setSidebarClosed] = useState(false);
    const [subMenuOpen, setSubMenuOpen] = useState({
        dashboard: false,
        events: false
    });

    const toggleSideBar = () => {
        setSidebarClosed((prevState) => !prevState);
        setSubMenuOpen({
            dashboard: false,
            events: false,
        }); //Close all sub menus when close or open sidebar
    };

    const toggleSubMenu = (menuName) => {
        setSubMenuOpen((prevMenu) => ({
            ...prevMenu,
            [menuName]: !prevMenu[menuName]
        }));

        //If user clicks on the icon while sidebar is closed, open the sidebar
        if (sidebarClosed) {
            setSidebarClosed(false);
        }
    };

    const navigate = useNavigate();
    return (
        <nav id="sidebar" className={sidebarClosed ? "close" : ""}>
            <ul>
                <li>
                    <img src={VSA_redlogo} className="logo" alt="vsa-logo"/>
                    {/* <span className="logo">VSA</span> */}
                    <button type="button" id="toggle-btn" className={sidebarClosed ? "rotate" : ""} onClick={toggleSideBar}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-240 200-480l240-240 56 56-183 184 183 184-56 56Zm264 0L464-480l240-240 56 56-183 184 183 184-56 56Z" /></svg>
                    </button>
                </li>
                <li>
                    <button type="button" className={subMenuOpen.dashboard ? "dropdown-btn rotate" : "dropdown-btn"} onClick={() => toggleSubMenu("dashboard")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z" /></svg>
                        <span>Dashboard</span>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" /></svg>
                    </button>
                    <ul className={subMenuOpen.dashboard ? "sub-menu show" : "sub-menu"}>
                        <div>
                            <li>
                                <NavLink to="/officer" end className={({ isActive }) => (isActive ? "active" : "")}>
                                    Overall
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/officer/dashboard/budget-board" className={({ isActive }) => (isActive ? "active" : "")}>
                                    Budget
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/officer/dashboard/event-board" className={({ isActive }) => (isActive ? "active" : "")}>
                                    Events
                                </NavLink>
                            </li>
                        </div>
                    </ul>
                </li>
                <li>
                    <NavLink to="/officer/availability" className={({ isActive }) => (isActive ? "active" : "")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" /></svg>
                        <span>Availability</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/officer/todo-list" className={({ isActive }) => (isActive ? "active" : "")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z" /></svg>
                        <span>To-do List</span>
                    </NavLink>
                </li>
                <li>
                    <button type="button" className={subMenuOpen.events ? "dropdown-btn rotate" : "dropdown-btn"} onClick={() => toggleSubMenu("events")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M337-410q55 1 94-37.5t39-94.5q0-29-13.5-54.5T422-642q-38-38-91.5-58T223-720q-31 0-47 15.5T160-660q0 53 16.5 103.5T229-467q22 23 49 40t59 17Zm347-228L557-765l255-121 18 176-146 72Zm88.5 76.5Q754-565 742-579l-14-15 109-52 2 20q3 19-5.5 35.5T808-566q-17 8-35.5 4.5ZM80-660q0-66 37.5-103T223-800q71 0 139 27t119 78q31 31 49.5 70t18.5 83q0 32-9.5 62T510-425l289 289-56 56-289-289q-26 19-55.5 29.5T337-330q-48-1-90.5-23T172-412q-45-51-68.5-115T80-660Zm235 95Z" /></svg>
                        <span>Events</span>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" /></svg>
                    </button>
                    <ul className={subMenuOpen.events ? "sub-menu show" : "sub-menu"}>
                        <div>
                            <li>
                                <NavLink to="/officer/events/manage-event" className={({ isActive }) => (isActive ? "active" : "")}>
                                    Manage Events
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/officer/events/create-event" className={({ isActive }) => (isActive ? "active" : "")}>
                                    Create New Events
                                </NavLink>
                            </li>
                        </div>
                    </ul>
                </li>
            </ul>

            <button type="button" id="exit-admin-button" onClick={() => navigate("/")}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
                <span>Back to Main</span>
            </button>
        </nav>
    );
};

export default OfficerNavBar;