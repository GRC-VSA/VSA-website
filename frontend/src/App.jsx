import "./App.css";
import { Routes, Route } from "react-router-dom";
import { EventsProvider } from "./context/EventsContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import GuestLayout from "./layouts/GuestLayout.jsx"
import OfficerLayout from "./layouts/OfficerLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";


import HomePage from "./guest_pages/HomePage.jsx";
import SignInPage from "./guest_pages/SignInPage.jsx";
import UpcomingEventsPage from "./guest_pages/UpcomingEventsPage.jsx";
import OldEventsPage from "./guest_pages/OldEventsPage.jsx";
import RegisterPage from "./guest_pages/RegisterPage.jsx";

import OverallBoard from "./officer_pages/dashboard/OverallBoard.jsx";
import BudgetBoard from "./officer_pages/dashboard/BudgetBoard.jsx";
import EventBoard from "./officer_pages/dashboard/EventBoard.jsx";
import TodoPage from "./officer_pages/TodoPage.jsx";

import CreateEventPage from "./officer_pages/CreateEventPage.jsx";
import ManageEventPage from "./officer_pages/ManageEventPage.jsx";
import AvailabilityPage from "./officer_pages/AvailabilityPage.jsx";

function App() {
  return (
    <EventsProvider>
      {/* <NavBar /> */}
      <Routes>
        <Route path="/" element={<GuestLayout />}>
          <Route index element={<HomePage />} />
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="upcoming-events" element={<UpcomingEventsPage />} />
          <Route path="old-events" element={<OldEventsPage />} />
        </Route>


        <Route
          path="/officer"
          element={
            //Add and configure roles heree ----|------------|
            //                                  V            V
            <ProtectedRoute allowedRoles={["officer", "president"]}>
              <OfficerLayout />
            </ProtectedRoute>
          }>
          <Route index element={<OverallBoard />} />
          <Route path="dashboard/budget-board" element={<BudgetBoard />} />
          <Route path="dashboard/event-board" element={<EventBoard />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="todo-list" element={<TodoPage />} />
          <Route path="events/create-event" element={<CreateEventPage />} />
          <Route path="events/manage-event" element={<ManageEventPage />} />
        </Route>
      </Routes>
    </EventsProvider>
  );
}

export default App;