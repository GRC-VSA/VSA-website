import "./App.css";
import { Routes, Route } from "react-router-dom";

import CreateEventPage from "./pages/create-events.jsx";
import HomePage from "./pages/HomePage.jsx";
import NavBar from "./components/NavBar.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import UpcomingEventsPage from "./pages/UpcomingEventsPage.jsx";
import OldEventsPage from "./pages/OldEventsPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import { EventsProvider } from "./context/EventsContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
      <EventsProvider>
        <NavBar />
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/upcoming-events" element={<UpcomingEventsPage/>} />
          <Route path="/old-events" element={<OldEventsPage/>} />
            <Route path="/create-event"
              element={
              //Add and configure roles heree ----|------------|
              //                                  V            V
                <ProtectedRoute allowedRoles={["officer", "president"]}>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
        </Routes>
      </EventsProvider>
  );
}

export default App;