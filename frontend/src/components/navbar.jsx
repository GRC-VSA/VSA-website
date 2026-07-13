import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LuSearch } from "react-icons/lu";  
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import VSA_coloredlogo from "../assets/VSA_coloredlogo.png"
import "./NavBar.css";


const NavBar = () => {
  const { user, logout } = useAuth();
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  const navigate = useNavigate();
  const handleLogOut = () => {
    logout();
    navigate("/home");
  }

  let canCreateEvent = false;
  if (user !== null) {
    if (user.role === "officer" || user.role === "president") {
      canCreateEvent = true;
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-background">
        <NavLink to="/home" className="logo-div">
          <img src={VSA_coloredlogo} alt={"vsa-logo-red"} className="logo"></img>
        </NavLink>
 
        <div className="navbar-pages">
          <div className="navbar-dropdown" onMouseEnter={() => setIsEventsOpen(true)} onMouseLeave={() => setIsEventsOpen(false)}>
            <button className="nav-link dropdown-trigger" id="">Events</button>
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
          </div>
          <NavLink to ="/products" className={( {isActive}) => (isActive ? "nav-link-active" : "nav-link")}>
            Products
          </NavLink>
          <NavLink to ="/officers" className={( {isActive}) => (isActive ? "nav-link-active" : "nav-link")}>
            Our Team
          </NavLink>
          <NavLink to ="/apply" className={( {isActive}) => (isActive ? "nav-link-active" : "nav-link")}>
            Apply
          </NavLink>
          <NavLink to ="/sponsors" className={( {isActive}) => (isActive ? "nav-link-active" : "nav-link")}>
            Sponsors
          </NavLink>                  
        </div>

        <div className="search-and-signin-section">
          <LuSearch/>

            {
              user ? (
                <button type="button" className="sign-in " onClick={handleLogOut}>logOut</button>
              ) : 
                <NavLink to="/sign-in" className="sign-in">
                  Sign-in
                </NavLink>
            }
        </div>
      </div>

    </nav>
  );
};

export default NavBar;