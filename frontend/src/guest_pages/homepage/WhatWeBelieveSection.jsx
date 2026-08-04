import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhatWeBelieveSection.css";

const WhatWeBelieveSection = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="what-we-believe" ref={sectionRef}>
      <div className="what-we-believe__text reveal">
        <span className="section-label">03 — Perspective</span>
        <h2 className="section-heading section-heading--left">
          What We Believe
        </h2>
        <p>
          History and politics have their own ways of dividing the
          Vietnamese people.
        </p>
        <p>
          But we believe: every Vietnamese goes beyond distinct hometown,
          region, or political belief. No matter where you live, we remain
          connected as descendants of the dragon and the fairy.
        </p>
        <p>
          No matter where we are on the road — beginning a new life in the
          United States or a Vietnamese classroom working to reconnect with
          your roots — VSA is more than happy to stand beside you.
        </p>
      </div>

      <div className="what-we-believe__image reveal">
        <img
          src="/assets/homepage/what-we-believe.jpg"
          alt="VSA members group photo"
        />
        <div className="what-we-believe__badge">VSA</div>
      </div>
    </section>
  );
};

export default WhatWeBelieveSection;
