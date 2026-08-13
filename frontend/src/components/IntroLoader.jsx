import { useEffect, useRef, useState } from 'react';
import './IntroLoader.css';

const MIN_DISPLAY_MS = 900; // floor so it never just flashes on a fast connection

/**
 * Full-screen intro shown while the app boots. Wipes away once `ready`
 * flips true (respects a minimum display time so it never flashes).
 *
 * <IntroLoader ready={appReady} />
 */
export default function IntroLoader({ ready }) {
    const [wiping, setWiping] = useState(false);
    const [mounted, setMounted] = useState(true);
    const startTime = useRef(Date.now());

    useEffect(() => {
        if (!ready) return;
        const remaining = Math.max(MIN_DISPLAY_MS - (Date.now() - startTime.current), 0);

        const wipeTimer = setTimeout(() => setWiping(true), remaining);
        return () => clearTimeout(wipeTimer);
    }, [ready]);

    useEffect(() => {
        if (!wiping) return;
        const unmountTimer = setTimeout(() => setMounted(false), 700);
        return () => clearTimeout(unmountTimer);
    }, [wiping]);

    if (!mounted) return null;

    return (
        <div className={`vsa-intro${wiping ? ' vsa-intro--wipe' : ''}`}>
            <p className="vsa-intro__tagline">One club. One culture</p>
            <span className="vsa-intro__vsa">VSA</span>
            <span className="vsa-intro__grc">grc</span>
        </div>
    );
}