import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EventCarousel from "./EventCarousel.jsx";
import WhoWeAreSection from "./WhoWeAreSection.jsx";
import WhatWeDoSection from "./WhatWeDoSection.jsx";
import WhatWeBelieveSection from "./WhatWeBelieveSection.jsx";
import HomeFooter from "./HomeFooter.jsx";
import "./HomeSections.css";

const HomePage = () => {
    // Images loading after mount can also change page height / trigger
    // positions — catch that with a final refresh once everything's in.
    useEffect(() => {
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);

    return (
        <main className="homepage">
            <EventCarousel />
            <WhoWeAreSection />
            <WhatWeDoSection />
            <WhatWeBelieveSection />
            <HomeFooter />
        </main>
    );
};

export default HomePage;