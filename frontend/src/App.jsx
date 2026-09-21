import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import { EventsProvider } from "./context/EventsContext.jsx";
import { RecruitmentApplicantsProvider } from "./context/RecruitmentApplicantsContext.jsx";
import GuestLayout from "./layouts/GuestLayout.jsx"
import OfficerLayout from "./layouts/OfficerLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";


import HomePage from "./guest_pages/homepage/HomePage.jsx";
import SignInPage from "./guest_pages/SignInPage.jsx";
import EventsPage from "./guest_pages/EventsPage.jsx";
// import OldEventsPage from "./guest_pages/OldEventsPage.jsx";
import OurTeamPage from "./guest_pages/OurTeamPage.jsx";
import RegisterPage from "./guest_pages/RegisterPage.jsx";
import VerifyEmailPage from "./guest_pages/VerifyEmailPage.jsx";
import ForgotPasswordPage from "./guest_pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./guest_pages/ResetPasswordPage.jsx";
import ProductsPage from "./guest_pages/ProductsPage.jsx";
import EventRegistrationPage from "./guest_pages/EventRegistrationPage.jsx";
import RegistrationVerificationPage from "./guest_pages/RegistrationVerificationPage.jsx";
import SponsorsPage from "./guest_pages/SponsorsPage.jsx";
import ApplyPage from "./guest_pages/ApplyPage.jsx";
import MyApplicationsPage from "./guest_pages/MyApplications.jsx";

import OverallBoard from "./officer_pages/dashboard/OverallBoard.jsx";
import BudgetBoard from "./officer_pages/dashboard/BudgetBoard.jsx";
import EventBoard from "./officer_pages/dashboard/EventBoard.jsx";
import EditApplicationForm from "./officer_pages/recruitment/EditApplicationForm.jsx";
import ToDoPage from "./officer_pages/ToDoPage.jsx";
import CreateEventPage from "./officer_pages/CreateEventPage.jsx";
import ManageEventPage from "./officer_pages/ManageEventPage.jsx";
import CreateRegistrationPage from "./officer_pages/CreateRegistrationPage.jsx";
import ViewApplicants from "./officer_pages/recruitment/ViewApplicants.jsx";
import ApplicantDetail from "./officer_pages/recruitment/ApplicantDetail.jsx";

import AvailabilityListPage from "./officer_pages/availability/AvailabilityListPage.jsx";
import AvailabilityDetailPage from "./officer_pages/availability/AvailabilityDetailPage.jsx";
import CollectAvailabilityFlow from "./officer_pages/availability/CollectAvailabilityFlow.jsx";

import IntroLoader from "./components/IntroLoader.jsx";

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") {
      setAppReady(true);
      return;
    }
    const handleLoad = () => setAppReady(true);
    window.addEventListener("load", handleLoad);
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  return (
    <EventsProvider>
      <IntroLoader ready={appReady} />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<GuestLayout />}>
          <Route index element={<HomePage />} />
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/our-team" element={<OurTeamPage />} />
          {/* <Route path="old-events" element={<OldEventsPage />} /> */}
          <Route path="events/:eventId/registration-form" element={<EventRegistrationPage />} />
          <Route path="events/:eventId/registration/verify/:verificationId" element={<RegistrationVerificationPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/my-applications" element={<MyApplicationsPage/>}/>
        </Route>

        <Route
          path="/officer"
          element={
            //Add and configure roles heree ----|------------|
            //                                  V            V
            <ProtectedRoute allowedRoles={["officer", "president"]}>
              <RecruitmentApplicantsProvider>
                <OfficerLayout />
              </RecruitmentApplicantsProvider>
            </ProtectedRoute>
          }>
          <Route index element={<OverallBoard />} />
          <Route path="dashboard/budget-board" element={<BudgetBoard />} />
          <Route path="dashboard/event-board" element={<EventBoard />} />
          <Route path="availability" element={<AvailabilityListPage />} />
          <Route path="availability/collect" element={<CollectAvailabilityFlow />} />
          <Route path="availability/:id" element={<AvailabilityDetailPage />} />
          <Route path="todo-list" element={<ToDoPage />} />
          <Route path="events/create-event" element={<CreateEventPage />} />
          <Route path="events/manage-event" element={<ManageEventPage />} />
          <Route path="events/:eventId/create-registration-form" element={<CreateRegistrationPage />} />
          <Route path="recruitment/applicants/:applicationId" element={<ApplicantDetail />} />
          <Route path="recruitment/applicants" element={<ViewApplicants />} />
          <Route path="recruitment/edit-form" element={<EditApplicationForm />} />
        </Route>

      </Routes>
    </EventsProvider>
  );
}

export default App;