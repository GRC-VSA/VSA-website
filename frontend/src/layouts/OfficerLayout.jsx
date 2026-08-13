import { Outlet, useLocation } from "react-router-dom";
import OfficerNavBar from "../components/OfficerNavBar.jsx";
import "./OfficerLayout.css";


// ---------- uncomment this for top bar again (@.@) Not recommended bruh
// const pageHeader = {
//     "/officer": {
//         title: "Overall Dashboard",
//         description: "The overall performance of the club"
//     },
//     "/officer/dashboard/budget-board": {
//         title: "Budget Dashboard",
//         description: "Track VSA income, expenses, and budget planning"
//     },
//     "/officer/dashboard/event-board": {
//         title: "Event Dashboard",
//         description: "Track the KPI and performance of each event individually"
//     },
//     "/officer/availability": {
//         title: "Availability",
//         description: "Fill out the your availability schedule for events"
//     },
//     "/officer/todo-list": {
//         title: "Todo list",
//         description: "See your todo list here!"
//     },
//     "/officer/events/create-event": {
//         title: "Create Event",
//         description: "Create a new event and publish it on the website"
//     },
//     "/officer/events/manage-event": {
//         title: "Manage Event",
//         description: "Edit, delete, and review existing events."
//     }
// }

const OfficerLayout = () => {
    // const location = useLocation();
    // const currentPage = pageHeader[location.pathname]
    return (
        <div className="officer-layout">
            <OfficerNavBar />
            <div className="right-content-container">
                {/* 
                    ---- uncomment if we are back to
                    top bar again (@.@) ------------
                    <header className="top-bar">
                    <div className="top-bar-content">
                        <h1>{currentPage.title}</h1>
                        <span>{currentPage.description}</span>
                    </div>
                </header> */}
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default OfficerLayout;