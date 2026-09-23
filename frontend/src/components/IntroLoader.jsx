import { useEffect, useRef, useState } from "react";
import "./IntroLoader.css";

const MIN_DISPLAY_MS = 900;

export default function IntroLoader({ ready }) {
    const [fontsReady, setFontsReady] = useState(false);
    const [wiping, setWiping] = useState(false);
    const [mounted, setMounted] = useState(true);
    const visibleSince = useRef(null);

    useEffect(() => {
        let active = true;

        const revealText = () => {
            if (!active) return;
            visibleSince.current = Date.now();
            setFontsReady(true);
        };

        if (document.fonts?.load) {
            Promise.all([
                document.fonts.load("500 24px Poppins"),
                document.fonts.load("800 300px Poppins"),
            ]).then(revealText, revealText);
        } else {
            revealText();
        }

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!ready || !fontsReady) return;

        const elapsed = Date.now() - visibleSince.current;
        const remaining = Math.max(MIN_DISPLAY_MS - elapsed, 0);
        const wipeTimer = setTimeout(() => setWiping(true), remaining);

        return () => clearTimeout(wipeTimer);
    }, [ready, fontsReady]);

    useEffect(() => {
        if (!wiping) return;

        const unmountTimer = setTimeout(() => setMounted(false), 700);
        return () => clearTimeout(unmountTimer);
    }, [wiping]);

    if (!mounted) return null;

    return (
        <div
            className={`vsa-intro${fontsReady ? " vsa-intro--fonts-ready" : ""}${wiping ? " vsa-intro--wipe" : ""}`}
        >
            <p className="vsa-intro__tagline">One club. One culture</p>
            <span className="vsa-intro__vsa">VSA</span>
            <span className="vsa-intro__grc">grc</span>
        </div>
    );
}