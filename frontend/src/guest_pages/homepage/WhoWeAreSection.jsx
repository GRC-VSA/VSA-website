import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhoWeAreSection.css";

// Swap these for the real photos — keeping the middle slot wider to match
// the collage layout in the Figma.
const photos = [
  { src: "/assets/homepage/who-we-are-1.jpg", wide: false },
  { src: "/assets/homepage/who-we-are-2.jpg", wide: false },
  { src: "/assets/homepage/who-we-are-3.jpg", wide: true },
  { src: "/assets/homepage/who-we-are-4.jpg", wide: false },
  { src: "/assets/homepage/who-we-are-5.jpg", wide: false },
  { src: "/assets/homepage/who-we-are-6.jpg", wide: false },
];

const WhoWeAreSection = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="who-we-are" ref={sectionRef}>
      <div className="who-we-are__intro reveal">
        <span className="section-label">01 — About us</span>
        <h2 className="section-heading">Who We Are</h2>
        <p className="who-we-are__text">
          We are self-driven Vietnamese teenagers from across Vietnam and
          around the world, brought together at Green River College to form
          a strong and unified Vietnamese community on campus named{" "}
          <strong>Vietnamese Student Association</strong> —{" "}
          <strong>VSA</strong>.
        </p>
        <button type="button" className="pill-button">
          Learn More About Our Team
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="who-we-are__strip">
        {photos.map((photo, i) => (
          <div
            key={i}
            className={`who-we-are__photo reveal${
              photo.wide ? " who-we-are__photo--wide" : ""
            }`}
          >
            <img src={photo.src} alt="" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhoWeAreSection;
