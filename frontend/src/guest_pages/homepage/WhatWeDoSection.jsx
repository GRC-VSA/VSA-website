import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import "./WhatWeDoSection.css";

import poster1 from "../../assets/guest/homepagewhatwedo/TRIP COMING SOON!.png";
import poster2 from "../../assets/guest/homepagewhatwedo/Lotus in the Jade Well Poster.png";
import poster3 from "../../assets/guest/homepagewhatwedo/Knockout stage poster draft 2.png";

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
          {/* Card 1: Club Meetings & Gatherings */}
          <div className="activity-card activity-card--light reveal">
            <div className="activity-card__art activity-card__art--meetings">
              {/* Curved Tail SVGs + Floating Badge Icons */}
              <div className="floating-badge badge--top-left">
                <svg className="swoosh-tail swoosh--tl" viewBox="0 0 100 60" fill="none">
                  <path d="M10 50 Q 60 10 95 35" stroke="rgba(216, 61, 59, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div className="badge-circle">
                  <span className="badge-icon">🎮</span>
                </div>
              </div>

              <div className="floating-badge badge--top-right">
                <svg className="swoosh-tail swoosh--tr" viewBox="0 0 100 60" fill="none">
                  <path d="M5 40 Q 50 5 90 20" stroke="rgba(216, 61, 59, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div className="badge-circle">
                  <span className="badge-icon">🙌</span>
                </div>
              </div>

              <div className="floating-badge badge--bottom-left">
                <svg className="swoosh-tail swoosh--bl" viewBox="0 0 100 60" fill="none">
                  <path d="M90 10 Q 40 50 10 35" stroke="rgba(216, 61, 59, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div className="badge-circle">
                  <span className="badge-icon">🤝</span>
                </div>
              </div>

              <div className="floating-badge badge--bottom-right">
                <svg className="swoosh-tail swoosh--br" viewBox="0 0 100 60" fill="none">
                  <path d="M10 10 Q 50 55 90 40" stroke="rgba(216, 61, 59, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div className="badge-circle">
                  <span className="badge-icon">🎵</span>
                </div>
              </div>

              {/* Central Flyer */}
              <img
                  src="/assets/homepage/meetings-flyer.png"
                  alt="VSA Club Meeting Flyer"
                  className="meetings-flyer-img"
              />
            </div>

            <div className="activity-card__content">
              <h4>Club Meetings &amp; Gatherings</h4>
              <p>
                Warm and cozy meetings in which students make friends, play games
                and have a lot of fun.
              </p>
            </div>
          </div>

          {/* Card 2: Large-scale Events */}
          <div className="activity-card activity-card--light reveal">
            <div className="activity-card__content">
              <h4>Large-scale Events</h4>
              <p>
                Immersive and spectacular experience for participants to enjoy and
                explore Viet culture
              </p>
            </div>

            <div className="activity-card__art activity-card__art--events">
              {/* Red Platform Disc */}
              <div className="events-red-platform" />

              {/* Stacked Posters (Front to Back) */}
              <div className="poster-stack">
                <img
                    src={poster1}
                    alt="Field Trip Poster Front"
                    className="poster-img poster-1"
                />
                <img
                    src={poster2}
                    alt="Event Poster Middle"
                    className="poster-img poster-2"
                />
                <img
                    src={poster3}
                    alt="Event Poster Back"
                    className="poster-img poster-3"
                />
              </div>
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