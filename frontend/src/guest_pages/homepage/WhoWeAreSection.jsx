import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhoWeAreSection.css";

// 5 photos: two narrow, one wide (group photo), a gap, then two more narrow.
// Swap these for the real photos.
const photos = [
  { src: "/assets/homepage/who-we-are-1.jpg" },
  { src: "/assets/homepage/who-we-are-2.jpg" },
  { src: "/assets/homepage/who-we-are-3.jpg", wide: true },
  { src: "/assets/homepage/who-we-are-4.jpg", groupStart: true },
  { src: "/assets/homepage/who-we-are-5.jpg" },
];

const WhoWeAreSection = () => {
  const sectionRef = useScrollReveal();

  return (
      <section className="who-we-are" ref={sectionRef}>
        <div className="who-we-are__intro reveal">
          <span className="section-label">01 - About us</span>
          <h2 className="section-heading">Who We Are</h2>
          <p className="who-we-are__text">
            We are self-driven Vietnamese teenagers from across Vietnam and
            around the world, brought together at Green River College to form
            a strong and unified Vietnamese community on campus named{" "}
            &ldquo;
            <span className="letter-accent">V</span>ietnamese{" "}
            <span className="letter-accent">S</span>tudent{" "}
            <span className="letter-accent">A</span>ssociation&rdquo; -{" "}
            <strong className="text-accent">VSA</strong>.
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
                  }${photo.groupStart ? " who-we-are__photo--group-start" : ""}`}
              >
                <img src={photo.src} alt="" />
              </div>
          ))}
        </div>
      </section>
  );
};

export default WhoWeAreSection;