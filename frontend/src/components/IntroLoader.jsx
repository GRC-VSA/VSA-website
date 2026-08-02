import { useEffect, useRef, useState } from 'react';
import './IntroLoader.css';

const MIN_DISPLAY_MS = 1200; // floor so it never just flashes on a fast connection

/**
 * Full-screen intro: counts up while the app boots (auth check, initial
 * data fetch), then wipes away once `ready` flips true.
 *
 * <IntroLoader ready={appReadyFromRedux} />
 */
export default function IntroLoader({ ready }) {
    const [count, setCount] = useState(0);
    const [wiping, setWiping] = useState(false);
    const [mounted, setMounted] = useState(true);
    const startTime = useRef(Date.now());
    const rafRef = useRef(null);

    // Ease toward 90% while we wait — never claims to be done before it is.
    useEffect(() => {
        function tick() {
            setCount((c) => (c >= 90 ? c : Math.min(c + (90 - c) * 0.04 + 0.15, 90)));
            rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Once actually ready, finish the count quickly, then wipe.
    useEffect(() => {
        if (!ready) return;
        cancelAnimationFrame(rafRef.current);

        const remaining = Math.max(MIN_DISPLAY_MS - (Date.now() - startTime.current), 0);

        const startFinish = setTimeout(() => {
            let start = null;
            function finish(ts) {
                if (!start) start = ts;
                const t = Math.min((ts - start) / 400, 1);
                setCount((c) => {
                    const base = c < 90 ? 90 : c;
                    return base + (100 - base) * t;
                });
                if (t < 1) {
                    requestAnimationFrame(finish);
                } else {
                    setCount(100);
                    setTimeout(() => setWiping(true), 250);
                    setTimeout(() => setMounted(false), 250 + 700);
                }
            }
            requestAnimationFrame(finish);
        }, remaining);

        return () => clearTimeout(startFinish);
    }, [ready]);

    if (!mounted) return null;

    return (
        <div className={`vsa-intro${wiping ? ' vsa-intro--wipe' : ''}`}>
            <div className="vsa-intro__topbar" />

            <p className="vsa-intro__tagline">One club. One culture.</p>

            <div className="vsa-intro__content">
                <div className="vsa-intro__wordmark">
                    <span className="vsa-intro__vsa">VSA</span>
                    <span className="vsa-intro__grc">grc</span>
                </div>
                <div className="vsa-intro__meter">
                    <span className="vsa-intro__count">{Math.floor(count)}</span>
                    <span className="vsa-intro__percent">%</span>
                </div>
            </div>

            <div className="vsa-intro__track">
                <div className="vsa-intro__fill" style={{ width: `${count}%` }} />
            </div>
        </div>
    );
}