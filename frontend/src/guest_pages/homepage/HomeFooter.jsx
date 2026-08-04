import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./HomeFooter.css";

const HomeFooter = () => {
  const sectionRef = useScrollReveal();

  return (
    <footer className="home-footer" ref={sectionRef}>
      <div className="home-footer__brand reveal">
        <div className="home-footer__logo">VSA</div>
        <h3>Vietnamese Student Association</h3>
      </div>

      <div className="home-footer__columns reveal">
        <div className="home-footer__contact">
          <h4>Contact</h4>
          <p>
            Green River College
            <br />
            12401 SE 320th St, Auburn, WA 98092
          </p>
          <p>grcvsa@greenriver.edu</p>
        </div>

        <div className="home-footer__cta">
          <button type="button" className="pill-button pill-button--light">
            Become a Member
          </button>
          <button type="button" className="pill-button pill-button--outline">
            Apply as Officer
          </button>
        </div>
      </div>

      <div className="home-footer__socials reveal">
        {/* swap hrefs + swap these letters for real icon components */}
        <a href="#" aria-label="Instagram">IG</a>
        <a href="#" aria-label="Facebook">FB</a>
        <a href="#" aria-label="TikTok">TT</a>
      </div>
    </footer>
  );
};

export default HomeFooter;
