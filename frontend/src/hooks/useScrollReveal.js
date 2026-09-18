import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Attach the returned ref to a section wrapper. Any descendant with the
 * `selector` class (default ".reveal") will fade + slide up once it
 * scrolls into view. Elements close together in scroll position are
 * grouped and staggered automatically via ScrollTrigger.batch.
 *
 * Usage:
 *   const sectionRef = useScrollReveal();
 *   <section ref={sectionRef}>
 *     <h2 className="reveal">Heading</h2>
 *     <p className="reveal">Body text</p>
 *   </section>
 *
 * Pages whose `.reveal` elements change after the first render (conditional
 * loading/error states, filtered lists) pass a `rerunKey`: a primitive that
 * changes whenever the set of targets changes, so the effect re-attaches the
 * triggers. Must be a primitive (string/number) — an array or object literal
 * is a new value every render and would re-run the effect endlessly.
 */
export function useScrollReveal(selector = ".reveal", rerunKey = "") {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const targets = container.querySelectorAll(selector);
        if (targets.length === 0) return;

        const ctx = gsap.context(() => {
            // 1. Force clear any inline GSAP transforms and reset hidden state
            gsap.set(targets, { opacity: 0, y: 40 });

            ScrollTrigger.batch(targets, {
                start: "top 85%",
                once: false, // Changed from true to allow re-triggering when scrolling back up/down
                onEnter: (batch) =>
                    gsap.to(batch, {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: "power2.out",
                        stagger: 0.12,
                        overwrite: true,
                    }),
                onLeaveBack: (batch) =>
                    gsap.to(batch, {
                        opacity: 0,
                        y: 40,
                        duration: 0.3,
                        ease: "power2.in",
                        overwrite: true,
                    }),
            });

            // 2. Force ScrollTrigger to recalculate exact offsets after window scroll resets
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        }, container);

        return () => ctx.revert();
    }, [selector, rerunKey]);

    return containerRef;
}