import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhatWeDoSection.css";

const WhatWeDoSection = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="what-we-do" ref={sectionRef}>
      <div className="what-we-do__intro reveal">
        <span className="section-label">02 — Activities</span>
        <h2 className="section-heading">What We Do</h2>
        <h3 className="what-we-do__subheading">Through Our Activities</h3>
      </div>

      <div className="what-we-do__grid">
        <div className="activity-card activity-card--light reveal">
          <div className="activity-card__art" />
          <h4>Club Meetings &amp; Gatherings</h4>
          <p>
            Weekly socials, workshops, and hangouts that bring our members
            together.
          </p>
        </div>

        <div
          className="activity-card activity-card--image reveal"
          style={{ backgroundImage: "url(/assets/homepage/large-scale-events.jpg)" }}
        >
          <h4>Large-scale Events</h4>
        </div>

        <div
          className="activity-card activity-card--image reveal"
          style={{ backgroundImage: "url(/assets/homepage/fair-performance.jpg)" }}
        >
          <h4>Fair and Performance</h4>
        </div>

        <div className="activity-card activity-card--cta reveal">
          <div className="activity-card__logo">VSA</div>
          <h4>Explore Our Events</h4>
          <button type="button" className="pill-button pill-button--light">
            Learn More About Events
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;
