import { NavLink } from "react-router-dom";
import "./NavBar.css";
import VSA_coloredlogo from "../assets/VSA_coloredlogo.png"
import { LuSearch } from "react-icons/lu";  

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-background">
        <NavLink to="/home" className="logo-div">
          <img src={VSA_coloredlogo} alt={"vsa-logo-red"} className="logo"></img>
        </NavLink>

        <div className="navbar-pages">
          <NavLink to="/create-event" className={( {isActive}) => (isActive ? "nav-link-active" : "nav-link")}>
            Events
          </NavLink>
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

          <NavLink to="/sign-in" className="sign-in">
            Sign-in
          </NavLink>
        </div>
      </div>

    </nav>
  );
};

export default NavBar;