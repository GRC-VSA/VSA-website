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
 */
export function useScrollReveal(selector = ".reveal") {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll(selector);
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 40 });

      ScrollTrigger.batch(targets, {
        start: "top 85%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.12,
            overwrite: true,
          }),
      });
    }, container);

    return () => ctx.revert();
  }, [selector]);

  return containerRef;
}
