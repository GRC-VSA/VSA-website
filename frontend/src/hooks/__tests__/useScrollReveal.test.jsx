import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useScrollReveal } from "../useScrollReveal.js";

const mocks = vi.hoisted(() => ({
    revert: vi.fn(),
    batch: vi.fn(),
}));

vi.mock("gsap", () => ({
    default: {
        registerPlugin: vi.fn(),
        set: vi.fn(),
        to: vi.fn(),
        context: (fn) => {
            fn();
            return { revert: mocks.revert };
        },
    },
}));

vi.mock("gsap/ScrollTrigger", () => ({
    ScrollTrigger: {
        batch: mocks.batch,
        refresh: vi.fn(),
    },
}));

const Section = ({ items, revealKey }) => {
    const sectionRef = useScrollReveal(".reveal", revealKey);
    return (
        <section ref={sectionRef}>
            {items.map((item) => (
                <div key={item} className="reveal">{item}</div>
            ))}
        </section>
    );
};

describe("useScrollReveal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("attaches scroll triggers once for an unchanged key", () => {
        const { rerender } = render(<Section items={["a"]} revealKey="loaded|ok|1" />);
        rerender(<Section items={["a"]} revealKey="loaded|ok|1" />);

        expect(mocks.batch).toHaveBeenCalledTimes(1);
    });

    it("re-runs when the key changes for a set of the same length", () => {
        const { rerender } = render(<Section items={["a"]} revealKey="loaded|ok|1" />);
        rerender(<Section items={["b"]} revealKey="loaded|ok|2" />);

        expect(mocks.revert).toHaveBeenCalledTimes(1);
        expect(mocks.batch).toHaveBeenCalledTimes(2);
    });

    it("re-runs after a loading transition puts the targets in the DOM", () => {
        const Page = ({ isLoading }) =>
            isLoading ? <p>Loading...</p> : <Section items={["a"]} revealKey="loaded|ok|1" />;

        const { rerender } = render(<Page isLoading={true} />);
        expect(mocks.batch).not.toHaveBeenCalled();

        rerender(<Page isLoading={false} />);
        expect(mocks.batch).toHaveBeenCalledTimes(1);
    });
});
