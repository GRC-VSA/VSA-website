import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { LuSearch, LuMenu, LuX } from "react-icons/lu";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import VSA_coloredlogo from "../assets/guest/VSA_coloredlogo.png"
import "./Navbar.css";


const Navbar = () => {
  const { user, logout } = useAuth();
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [accountIsClicked, setAccountIsClicked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarBackgroundRef = useRef(null);
  const navbarPagesRef = useRef(null);

  const navigate = useNavigate();
  const handleLogOut = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
      <NavLink to="/" className="logo-div" onClick={closeMobileMenu}>
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
                  <NavLink to="/upcoming-events" className="dropdown-item">
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
        <NavLink to="/officers" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
          Our Team
        </NavLink>
        <NavLink to="/apply" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
          Apply
        </NavLink>
        <NavLink to="/sponsors" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}>
          Sponsors
        </NavLink>
      </div>

      <div className="search-and-signin-section">
        <div className="search-icon-div">
          <LuSearch id="search-icon" />
        </div>
        {
          user ? (
            <div className="navbar-dropdown" onClick={() => setAccountIsClicked((accountState) => !accountState)}>
              <button type="button" className="user-account-div dropdown-trigger"><FaUser id="user-account-icon" /></button>
              {
                accountIsClicked && (
                  <div className="account-dropdown-menu">
                    <NavLink to="/setting" className="account-dropdown-item">
                      Setting
                    </NavLink>
                    <button type="button" onClick={handleLogOut} className="account-dropdown-item">
                      Logout
                    </button>
                    {
                      isOfficer && (
                        <button className="account-dropdown-item" onClick={() => { navigate("/officer") }}>
                          To Officer Board
                        </button>
                      )
                    }
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
        <NavLink to="/events" className="mobile-nav-link" onClick={closeMobileMenu}>
          Events
        </NavLink>
        <NavLink to="/products" className="mobile-nav-link" onClick={closeMobileMenu}>
          Products
        </NavLink>
        <NavLink to="/officers" className="mobile-nav-link" onClick={closeMobileMenu}>
          Our Team
        </NavLink>
        <NavLink to="/apply" className="mobile-nav-link" onClick={closeMobileMenu}>
          Apply
        </NavLink>
        <NavLink to="/sponsors" className="mobile-nav-link" onClick={closeMobileMenu}>
          Sponsors
        </NavLink>

        <div className="mobile-menu-divider" />

        {user ? (
          <>
            <NavLink to="/setting" className="mobile-nav-link" onClick={closeMobileMenu}>
              Setting
            </NavLink>
            {isOfficer && (
              <button
                type="button"
                className="mobile-nav-link mobile-nav-button"
                onClick={() => { closeMobileMenu(); navigate("/officer"); }}
              >
                To Officer Board
              </button>
            )}
            <button type="button" className="mobile-nav-link mobile-nav-button" onClick={handleLogOut}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/sign-in" className="mobile-nav-link" onClick={closeMobileMenu}>
            Sign-in
          </NavLink>
        )}
    </div>
  </nav>
);
};

export default Navbar;