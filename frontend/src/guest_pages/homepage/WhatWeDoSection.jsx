import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhatWeDoSection.css";

const WhatWeDoSection = () => {
  const sectionRef = useScrollReveal();

  return (
      <section className="what-we-do" ref={sectionRef}>
        <div className="what-we-do__intro reveal">
          <span className="section-label">02 – Action</span>
          <h2 className="section-heading">What We Do</h2>
          <h3 className="what-we-do__subheading">Through Our Activities</h3>
        </div>

        <div className="what-we-do__grid">
          {/* Card 1: Club Meetings */}
          <div className="activity-card activity-card--light reveal">
            <div className="activity-card__content">
              <h4>Club Meetings &amp; Gatherings</h4>
              <p>
                Warm and cozy meetings in which students make friends, play games
                and have a lot of fun.
              </p>
            </div>
            <div className="activity-card__art activity-card__art--meetings">
              <img
                  src="/assets/homepage/meetings-flyer.png"
                  alt="Club meetings flyer"
              />
            </div>
          </div>

          {/* Card 2: Large-scale Events */}
          <div className="activity-card activity-card--light reveal">
            <div className="activity-card__content">
              <h4>Large-scale Events</h4>
              <p>
                Immersive and spectacular experience for participants to enjoy
                and explore Viet culture
              </p>
            </div>
            <div className="activity-card__art activity-card__art--events">
              <img
                  src="/assets/homepage/stacked-events.png"
                  alt="Stacked event posters"
              />
              <div className="activity-card__shadow-ellipse" />
            </div>
          </div>

          {/* Card 3: Fair and Performance */}
          <div className="activity-card activity-card--light reveal">
            <div className="activity-card__content">
              <h4>Fair and Performance</h4>
              <p>
                Immersive and spectacular experience for participants to enjoy
                and explore Viet culture
              </p>
            </div>
            <div className="activity-card__art activity-card__art--performance">
              <img
                  src="/assets/homepage/performance-preview.png"
                  alt="Fair and performance preview"
              />
            </div>
          </div>

          {/* Card 4: CTA */}
          <div className="activity-card activity-card--cta reveal">
            <div className="activity-card__logo">
              <img src="/assets/homepage/vsa-logo-white.svg" alt="VSA Logo" />
            </div>
            <div className="activity-card__cta-bottom">
              <h4>Explore Our Events</h4>
              <button type="button" className="pill-button pill-button--light">
                Learn more about events
              </button>
            </div>
          </div>
        </div>
      </section>
  );
};

export default WhatWeDoSection;