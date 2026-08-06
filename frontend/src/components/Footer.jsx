import { useScrollReveal } from "../hooks/useScrollReveal.js";
import "./Footer.css";

const Footer = () => {
  const sectionRef = useScrollReveal();

  return (
      <footer className="home-footer" ref={sectionRef}>
        <div className="home-footer__container reveal">
          {/* Floating Brand Header */}
          <div className="home-footer__brand">
            <img
                src="/assets/homepage/vsa-logo.svg"
                alt="VSA Conical Hat Logo"
                className="home-footer__logo"
            />
            <h3 className="home-footer__title">VIETNAMESE</h3>
            <p className="home-footer__subtitle">STUDENT ASSOCIATION</p>
          </div>

          {/* 3-Column Layout */}
          <div className="home-footer__content">
            {/* Left Column: Contact */}
            <div className="home-footer__col home-footer__col--left">
              <h4 className="home-footer__heading">CONTACT</h4>
              <div className="home-footer__contact-details">
                <p className="home-footer__contact-name">Mia Luu</p>

                <p className="home-footer__contact-item">
                  <svg className="brand-icon" width="16" height="16" viewBox="0 0 24 24" fill="#ece0a6">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span>Secretary and Treasurer</span>
                </p>

                <p className="home-footer__contact-item">
                  <svg className="brand-icon" width="16" height="16" viewBox="0 0 24 24" fill="#ece0a6">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>425 – 547 – 7877</span>
                </p>

                <p className="home-footer__contact-item">
                  <svg className="brand-icon" width="16" height="16" viewBox="0 0 24 24" fill="#ece0a6">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>Luu.My@student.greenriver.edu</span>
                </p>
              </div>
            </div>

            {/* Center Column: CTAs & Social Links */}
            <div className="home-footer__col home-footer__col--center">
              <div className="home-footer__cta-group">
                <button type="button" className="pill-btn pill-btn--solid">
                  <span className="pill-btn__icon pill-btn__icon--left">↑</span>
                  <span>Browse Events</span>
                </button>

                <button type="button" className="pill-btn pill-btn--outline">
                  <span>Apply Officer</span>
                  <span className="pill-btn__icon pill-btn__icon--right">↑</span>
                </button>
              </div>

              <div className="home-footer__socials">
                <a href="#" className="social-btn" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ece0a6" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" className="social-btn" aria-label="Email">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ece0a6" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
                <a href="#" className="social-btn" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ece0a6" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
            </div>

            {/* Right Column: Motto */}
            <div className="home-footer__col home-footer__col--right">
              <h4 className="home-footer__heading home-footer__heading--motto">
                HIP HOP <span className="motto-underline">NEVA DIESS</span>
              </h4>
              <p className="home-footer__motto-text">
                Building a strong Vietnamese community on campus through culture,
                connection, and opportunities for growth and leadership.
              </p>
            </div>
          </div>
        </div>
      </footer>
  );
};

export default Footer;