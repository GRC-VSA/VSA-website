import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EventCarousel from "./EventCarousel.jsx";
import WhoWeAreSection from "./WhoWeAreSection.jsx";
import WhatWeDoSection from "./WhatWeDoSection.jsx";
import WhatWeBelieveSection from "./WhatWeBelieveSection.jsx";
import "./HomeSections.css";

const HomePage = () => {
    // useEffect(() => {
    //     // 1. Force window to scroll to top immediately on load/refresh
    //     window.scrollTo(0, 0);

    //     // 2. Disable browser's automatic scroll restoration on reload
    //     if ("scrollRestoration" in window.history) {
    //         window.history.scrollRestoration = "manual";
    //     }
    // }, []);
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
        </main>
    );
};

export default HomePage;