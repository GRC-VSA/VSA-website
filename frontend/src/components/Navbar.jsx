import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { LuSearch, LuMenu, LuX } from "react-icons/lu";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { replaceLocation } from "../utils/navigation.js";
import VSA_coloredlogo from "../assets/guest/VSA_coloredlogo.png"
import "./Navbar.css";


const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [accountIsClicked, setAccountIsClicked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarBackgroundRef = useRef(null);
  const navbarPagesRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname + location.search;
  const handleLogOut = () => {
    logout();
    setIsMobileMenuOpen(false);
    replaceLocation("/");
  }

  const handleApplyClick = (event) => {
    event.preventDefault();
    if (!isAuthenticated) {

      replaceLocation(
        `/sign-in?redirect=/apply&from=${encodeURIComponent(currentPage)}`
      )
    } else {
      replaceLocation(
        "/apply"
      )
    }
  }
  const closeMobileMenu = (event, pageName) => {
    setIsMobileMenuOpen(false);
    if (pageName !== "apply") {
      return;
    }
    handleApplyClick(event);
  }
  let isOfficer = false;
  if (user !== null) {
    if (user.role === "officer" || user.role === "president") {
      isOfficer = true;
    }
  }
  useEffect(() => {
    const maxScrollDistance = 500;

    const changeNavbarBackground = () => {
      if (!navbarBackgroundRef.current || !navbarPagesRef.current) {
        return;
      }

      const scrollProgress = Math.min(window.scrollY / maxScrollDistance, 1);
      const startWidth = navbarPagesRef.current.offsetWidth;
      const endWidth = navbarBackgroundRef.current.offsetWidth;

      const startHeight = navbarPagesRef.current.offsetHeight;
      const endHeight = navbarBackgroundRef.current.offsetHeight;

      const currentWidth =
        startWidth + (endWidth - startWidth) * scrollProgress;

      const currentHeight =
        startHeight + (endHeight - startHeight) * scrollProgress;

      const currentRadius = 25 * (1 - scrollProgress);

      navbarBackgroundRef.current.style.setProperty("--nav-bg-width", `${currentWidth}px`);
      navbarBackgroundRef.current.style.setProperty("--nav-bg-height", `${currentHeight}px`);
      navbarBackgroundRef.current.style.setProperty("--nav-bg-radius", `${currentRadius}px`);
    }

    changeNavbarBackground();

    window.addEventListener("scroll", changeNavbarBackground);
    window.addEventListener("resize", changeNavbarBackground);

    return () => {
      window.removeEventListener("scroll", changeNavbarBackground);
      window.removeEventListener("resize", changeNavbarBackground);
    };
  }, []);

  // Close mobile menu automatically if window is resized back to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-background" ref={navbarBackgroundRef}>
        <NavLink to="/" className="logo-div" onClick={(event) => closeMobileMenu(event, "homepage")}>
          <img src={VSA_coloredlogo} alt={"vsa-logo-red"} className="logo"></img>
        </NavLink>

        <div className="navbar-pages" ref={navbarPagesRef}>
          <NavLink to="/events" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
            Events
          </NavLink>
          {/* <div className="navbar-dropdown" onMouseEnter={() => setIsEventsOpen(true)} onMouseLeave={() => setIsEventsOpen(false)}>
            <button className="nav-link dropdown-trigger">Events</button>
            {
                isEventsOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/events" className="dropdown-item">
                    Upcoming Events
                  </NavLink>
                  <NavLink to="/old-events" className="dropdown-item">
                    Old Events
                  </NavLink>
                  {canCreateEvent && (
                    <NavLink to="/create-event" className="dropdown-item">Create Events</NavLink>
                  )}
                </div>
              )
            }
          </div> */}
          <NavLink to="/products" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
            Products
          </NavLink>
          <NavLink to="/our-team" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
            Our Team
          </NavLink>
          <NavLink to="/apply" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} onClick={handleApplyClick}>
            Apply
          </NavLink>
          <NavLink to="/sponsors" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} >
            Sponsors
          </NavLink>
        </div>

        <div className="search-and-signin-section">
          {/* <div className="search-icon-div">
            <LuSearch id="search-icon" />
          </div> */}
          {
            user ? (
              <div className="navbar-dropdown" onClick={() => setAccountIsClicked((accountState) => !accountState)}>
                <button type="button" className="user-account-div dropdown-trigger"><FaUser id="user-account-icon" /></button>
                {
                  accountIsClicked && (
                    <div className="account-dropdown-menu">
                      <NavLink to="/profile" className="account-dropdown-item">
                        <div className="item-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M680-240v-80h200v80H680Zm-80-200v-80h280v80H600Zm-80-200v-80h360v80H520ZM235-515q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM80-240v-76q0-21 10-40t28-30q45-27 95.5-40.5T320-440q56 0 106.5 13.5T522-386q18 11 28 30t10 40v76H80Zm160-110q-39 10-74 30h308q-35-20-74-30t-80-10q-41 0-80 10Zm108.5-221.5Q360-583 360-600t-11.5-28.5Q337-640 320-640t-28.5 11.5Q280-617 280-600t11.5 28.5Q303-560 320-560t28.5-11.5ZM320-600Zm0 280Z" /></svg>
                        </div>
                        Profile
                      </NavLink>
                      <NavLink to="/my-applications" className="account-dropdown-item">
                        <div className="item-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" /></svg>
                        </div>
                        Applications
                      </NavLink>
                      {
                        isOfficer && (
                          <button className="account-dropdown-item" onClick={() => { navigate("/officer") }}>
                            <div className="item-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M607.5-212.5Q660-265 660-340t-52.5-127.5Q555-520 480-520t-127.5 52.5Q300-415 300-340t52.5 127.5Q405-160 480-160t127.5-52.5ZM363-572q20-11 42.5-17.5T451-598L350-800H250l113 228Zm234 0 114-228H610l-85 170 19 38q14 4 27 8.5t26 11.5ZM256-208q-17-29-26.5-62.5T220-340q0-36 9.5-69.5T256-472q-42 14-69 49.5T160-340q0 47 27 82.5t69 49.5Zm448 0q42-14 69-49.5t27-82.5q0-47-27-82.5T704-472q17 29 26.5 62.5T740-340q0 36-9.5 69.5T704-208ZM403.5-91.5Q367-103 336-123q-9 2-18 2.5t-19 .5q-91 0-155-64T80-339q0-87 58-149t143-69L120-880h280l80 160 80-160h280L680-559q85 8 142.5 70T880-340q0 92-64 156t-156 64q-9 0-18.5-.5T623-123q-31 20-67 31.5T480-80q-40 0-76.5-11.5ZM480-340ZM363-572 250-800l113 228Zm234 0 114-228-114 228ZM406-230l28-91-74-53h91l29-96 29 96h91l-74 53 28 91-74-56-74 56Z" /></svg>
                            </div>
                            Officer site
                          </button>
                        )
                      }
                      <button type="button" onClick={handleLogOut} className="account-dropdown-item">
                        <div className="item-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-440q17 0 28.5-11.5T480-480q0-17-11.5-28.5T440-520q-17 0-28.5 11.5T400-480q0 17 11.5 28.5T440-440ZM280-120v-80l240-40v-445q0-15-9-27t-23-14l-208-34v-80l220 36q44 8 72 41t28 77v512l-320 54Zm-160 0v-80h80v-560q0-34 23.5-57t56.5-23h400q34 0 57 23t23 57v560h80v80H120Zm160-80h400v-560H280v560Z" /></svg>
                        </div>
                        Log out
                      </button>
                    </div>
                  )
                }
              </div>
            ) :
              <NavLink to="/sign-in" className="sign-in">
                Sign-in
              </NavLink>
          }
        </div>

        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <LuX id="mobile-menu-icon" /> : <LuMenu id="mobile-menu-icon" />}
        </button>
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
        <NavLink to="/events" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "events")}>
          Events
        </NavLink>
        <NavLink to="/products" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "products")}>
          Products
        </NavLink>
        <NavLink to="/our-team" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "our-team")}>
          Our Team
        </NavLink>
        {
          /* Next dev, plz also change closeMobileMenu logic if you change mobile code here.
             Backend requires guests to sign-in and be authenticated to view the apply page.
             So always navigate guests to sign-in page if they are unauthenticated as they click on
             the apply page
             closeMobileMenu(event, "apply") will navigate them to signin page
          */
        }
        <NavLink to="/apply" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "apply")}>
          Apply
        </NavLink>
        <NavLink to="/sponsors" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "sponsors")}>
          Sponsors
        </NavLink>

        <div className="mobile-menu-divider" />

        {user ? (
          <>
            <NavLink to="/profile" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "profile")}>
              Profile
            </NavLink>
            <NavLink to="/my-applications" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "my-application")}>
              Applications
            </NavLink>
            {isOfficer && (
              <button
                type="button"
                className="mobile-nav-link mobile-nav-button"
                onClick={(event) => { closeMobileMenu(event, "others"); replaceLocation("/officer"); }}
              >
                Officer site
              </button>
            )}
            <button type="button" className="mobile-nav-link mobile-nav-button" onClick={handleLogOut}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/sign-in" className="mobile-nav-link" onClick={(event) => closeMobileMenu(event, "sign-in")}>
            Sign-in
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;