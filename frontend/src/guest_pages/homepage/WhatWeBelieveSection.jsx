import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhatWeBelieveSection.css";
import cover from "../../assets/guest/DSCF2500.jpg";

const WhatWeBelieveSection = () => {
  const sectionRef = useScrollReveal();

  return (
      <section className="what-we-believe" ref={sectionRef}>
        <div className="what-we-believe__header reveal">
          <span className="section-label">03 – The motive</span>
          <h2 className="section-heading section-heading--left">What We Believe</h2>
          <div className="what-we-believe__divider" />
        </div>

        <div className="what-we-believe__content">
          <div className="what-we-believe__text reveal">
            <p>
              History and politics have their own ways of dividing the
              Vietnamese people.
            </p>
            <p>
              But we believe being Vietnamese goes beyond dialect, hometown,
              region, or political belief. No matter where you come from or what
              you believe, we remain connected as descendants of the Dragon and
              the Fairy.
            </p>
            <p>
              So whether you are an international student beginning a new life in
              the United States or a Vietnamese American wanting to reconnect
              with your roots, VSA is more than happy to stand beside you.
            </p>
          </div>

          <div className="what-we-believe__image-container reveal">
            <div className="what-we-believe__badge what-we-believe__badge--top">
              <img src="../../assets/guest/vsa-logo-icon.svg" alt="VSA Emblem" />
            </div>

            <div className="what-we-believe__image-frame">
              <img
                  src={cover}
                  alt="VSA members group photo"
              />
            </div>

            <div className="what-we-believe__badge what-we-believe__badge--bottom">
              <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#b32827"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>
      </section>
  );
};

export default WhatWeBelieveSection;