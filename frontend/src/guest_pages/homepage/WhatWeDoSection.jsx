import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import { useNavigate } from "react-router-dom";
import "./WhatWeDoSection.css";

import poster1 from "../../assets/guest/homepagewhatwedo/TRIP COMING SOON!.png";
import poster2 from "../../assets/guest/homepagewhatwedo/Lotus in the Jade Well Poster.png";
import poster3 from "../../assets/guest/homepagewhatwedo/Knockout stage poster draft 2.png";

import meetingsFlyer from "../../assets/guest/homepagewhatwedo/VSA club meeting.png";
import swoosh from "../../assets/guest/homepagewhatwedo/swoosh.svg";
import performaceCover from "../../assets/guest/homepagewhatwedo/nhuhoamuaxuan.png";
import plusMark2 from "../../assets/guest/homepagewhatwedo/plus-mark2.svg";
import plusMark1 from "../../assets/guest/homepagewhatwedo/plus-mark1.svg";
import plusMark3 from "../../assets/guest/homepagewhatwedo/plus-mark3.svg";

import whiteLogo from "../../assets/guest/homepagewhatwedo/whiteLogo.png";
const WhatWeDoSection = () => {
  const sectionRef = useScrollReveal();
  const navigate = useNavigate();

  return (
    <section className="what-we-do" ref={sectionRef}>
      <div className="what-we-do__intro reveal">
        <span className="section-label">02 – Action</span>
        <h2 className="section-heading">What We Do</h2>
        <h3 className="what-we-do__subheading">Through Our Activities</h3>
      </div>

      <div className="what-we-do__grid">
        {/* Card 1: Club Meetings & Gatherings */}
        <div className="activity-card activity-card--light reveal" id="activity-card-1">
          <div className="activity-card__art activity-card__art--meetings">
            {/* Curved Tail SVGs + Floating Badge Icons */}
            {/* <div className="floating-badge badge--top-left">
              <svg className="swoosh-tail swoosh--tl" viewBox="0 0 100 60" fill="none">
                <defs>
                  <linearGradient id="swoosh-grad-tl" gradientUnits="userSpaceOnUse" x1="10" y1="50" x2="95" y2="35">
                    <stop offset="0%" stopColor="#d83d3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d83d3b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M10 50 Q 60 10 95 35" stroke="url(#swoosh-grad-tl)" strokeWidth="11" fill="none" strokeLinecap="round" />
              </svg>
              <div className="badge-circle">
                <span className="badge-icon">🎮</span>
              </div>
            </div>

            <div className="floating-badge badge--top-right">
              <svg className="swoosh-tail swoosh--tr" viewBox="0 0 100 60" fill="none">
                <defs>
                  <linearGradient id="swoosh-grad-tr" gradientUnits="userSpaceOnUse" x1="5" y1="40" x2="90" y2="20">
                    <stop offset="0%" stopColor="#d83d3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d83d3b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M5 40 Q 50 5 90 20" stroke="url(#swoosh-grad-tr)" strokeWidth="11" fill="none" strokeLinecap="round" />
              </svg>
              <div className="badge-circle">
                <span className="badge-icon">🙌</span>
              </div>
            </div>

            <div className="floating-badge badge--bottom-left">
              <svg className="swoosh-tail swoosh--bl" viewBox="0 0 100 60" fill="none">
                <defs>
                  <linearGradient id="swoosh-grad-bl" gradientUnits="userSpaceOnUse" x1="90" y1="10" x2="10" y2="35">
                    <stop offset="0%" stopColor="#d83d3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d83d3b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M90 10 Q 40 50 10 35" stroke="url(#swoosh-grad-bl)" strokeWidth="11" fill="none" strokeLinecap="round" />
              </svg>
              <div className="badge-circle">
                <span className="badge-icon">🤝</span>
              </div>
            </div>

            <div className="floating-badge badge--bottom-right">
              <svg className="swoosh-tail swoosh--br" viewBox="0 0 100 60" fill="none">
                <defs>
                  <linearGradient id="swoosh-grad-br" gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="90" y2="40">
                    <stop offset="0%" stopColor="#d83d3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d83d3b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M10 10 Q 50 55 90 40" stroke="url(#swoosh-grad-br)" strokeWidth="11" fill="none" strokeLinecap="round" />
              </svg>
              <div className="badge-circle">
                <span className="badge-icon">🎵</span>
              </div>
            </div> */}  

            {/* Central Flyer */}
            <img src={swoosh} id="swoosh-effect"/>
            <img
              src={meetingsFlyer}
              alt="VSA Club Meeting Flyer"
              className="meetings-flyer-img"
            />
          </div>

          <div className="activity-card__content">
            <h4>Club Gatherings</h4>
            <p>
              Warm and cozy meetings where students make friends, play games
              and have fun.
            </p>
          </div>
          <img src={plusMark1} id="plus-mark-1"/>
        </div>

        {/* Card 2: Large-scale Events */}
        <div className="activity-card activity-card--light reveal" id="activity-card-2">
          <div className="events-decor" aria-hidden="true">
            {/* <span className="plus-mark plus-mark--1" />
            <span className="plus-mark plus-mark--2" />
            <span className="plus-mark plus-mark--3" /> */}
            <img src={plusMark2} id="plus-mark-2"/>
          </div>

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
              <div id="poster-frame-1">
                <img
                  src={poster1}
                  alt="Field Trip Poster Front"
                  className="poster-img poster-1"
                />
              </div>
              <div id="poster-frame-2">
                <img
                  src={poster2}
                  alt="Event Poster Middle"
                  className="poster-img poster-2"
                />
              </div>
              <div id="poster-frame-3">
                <img
                  src={poster3}
                  alt="Event Poster Back"
                  className="poster-img poster-3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Fair and Performance */}
        <div className="activity-card activity-card--light reveal" id="activity-card-3">
          <div className="activity-card__content">
            <h4>Fair &amp; Performance</h4>
            <p>
              Visual feasts for people interested in Viet culture.
            </p>
          </div>
          <div className="activity-card__art activity-card__art--performance">
            <div className="performance-photo">
              <div className="performance-photo__backdrop" aria-hidden="true" />
              <img
                src={performaceCover}
                alt="Fair and performance preview"
                className="performance-photo__img"
              />
            </div>
          </div>
          <img src={plusMark3} id="plus-mark-3"/>
        </div>

        {/* Card 4: CTA */}
        <div className="activity-card activity-card--cta reveal">
          <div className="activity-card__logo">
            <img src={whiteLogo} alt="VSA Logo" />
          </div>
          <div className="activity-card__cta-bottom">
            <h4>And So Much More!</h4>
            <button type="button" className="pill-button pill-button--light" onClick={() => navigate("/events")}>
              Learn About Events
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;