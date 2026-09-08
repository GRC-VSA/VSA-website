import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import { useNavigate } from "react-router-dom";
import "./WhoWeAreSection.css";

// Import all photos from HomePageWhoWeAre folder
import Gen4_2 from "../../assets/guest/homepagewhoweare/Gen4_2.jpg";
import IMG_3507 from "../../assets/guest/homepagewhoweare/IMG_3507.JPG";
import IMG_9221 from "../../assets/guest/homepagewhoweare/IMG_9221.jpg";
import P1021944min from "../../assets/guest/homepagewhoweare/P1021944-min.JPG";
import PhucJaydenDung from "../../assets/guest/homepagewhoweare/Phuc-jayden-Dung_japan.jpg";
import TiffLyBadminton from "../../assets/guest/homepagewhoweare/Tiff&Ly_badminton.JPG";
import TinVIFON from "../../assets/guest/homepagewhoweare/TinVIFON.JPG";
import VSAGroup from "../../assets/guest/homepagewhoweare/VSA group.jpg";
import VSAKid2 from "../../assets/guest/homepagewhoweare/VSA_kid2.jpg";
import ClubMeetingInterview from "../../assets/guest/homepagewhoweare/club-meeting-interview.jpg";
import EventGen4Gen5 from "../../assets/guest/homepagewhoweare/event_gen4_gen5.jpg";
import Gen2Gen3 from "../../assets/guest/homepagewhoweare/gen2-gen3.jpg";
import GirlsAtPark from "../../assets/guest/homepagewhoweare/girls at park.jpg";
import LunarNewYear from "../../assets/guest/homepagewhoweare/lunar-new-year.jpg";
import VSAInterview from "../../assets/guest/homepagewhoweare/vsa interview.jpg";
import VSAWithUniform from "../../assets/guest/homepagewhoweare/vsa-with-uniform.jpg";


const photos = [
  { src: Gen4_2, alt: "VSA Gen4 Event 2" },
  { src: IMG_3507, alt: "VSA Members Photo" },
  { src: IMG_9221, alt: "VSA Group Photo" },
  { src: P1021944min, alt: "VSA Activity" },
  { src: PhucJaydenDung, alt: "Phuc, Jayden & Dung in Japan" },
  { src: TiffLyBadminton, alt: "Tiff & Ly Badminton" },
  { src: TinVIFON, alt: "Tin VIFON Event" },
  { src: VSAGroup, alt: "VSA Group" },
  { src: VSAKid2, alt: "VSA Kids" },
  { src: ClubMeetingInterview, alt: "Club Meeting Interview" },
  { src: EventGen4Gen5, alt: "Event Gen4 Gen5" },
  { src: Gen2Gen3, alt: "Gen2 and Gen3" },
  { src: GirlsAtPark, alt: "Girls at Park" },
  { src: LunarNewYear, alt: "Lunar New Year Celebration" },
  { src: VSAInterview, alt: "VSA Interview" },
  { src: VSAWithUniform, alt: "VSA Members with Uniform" },
];

const WhoWeAreSection = () => {
  const sectionRef = useScrollReveal();
  const navigate = useNavigate();

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
          <button type="button" className="pill-button" onClick={() => navigate("/officers")}>
            Learn More About Our Team
            <span aria-hidden="true">→</span>
          </button>
        </div>

          {/* Infinite Scrolling Track */}
          <div className="who-we-are__scroll-container">
            <div className="who-we-are__scroll-track">
              {/* Set 1 */}
              {photos.map((photo, i) => (
                  <div
                      key={`set1-${i}`}
                      className={`who-we-are__photo-card ${
                          photo.wide ? "who-we-are__photo-card--wide" : ""
                      }`}
                  >
                    <img src={photo.src} alt={photo.alt} />
                  </div>
              ))}

              {/* Duplicated Set 2 for seamless loop */}
              {photos.map((photo, i) => (
                  <div
                      key={`set2-${i}`}
                      className={`who-we-are__photo-card ${
                          photo.wide ? "who-we-are__photo-card--wide" : ""
                      }`}
                  >
                    <img src={photo.src} alt={photo.alt} />
                  </div>
              ))}
          </div>
        </div>
      </section>
  );
};

export default WhoWeAreSection;