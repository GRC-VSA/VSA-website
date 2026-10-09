import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RespondersPanel from "../RespondersPanel.jsx";
import { responders } from "./fixtures.js";

describe("RespondersPanel", () => {
    it("shows counts, officers, pending officers and outside guests", () => {
        const { container } = render(<RespondersPanel responders={responders()} canManage={false} onRemove={() => {}} />);

        expect(screen.getByText("Responses")).toBeInTheDocument();
        expect(screen.getByText(/1 of 2 officers · 1 from outside VSA/)).toBeInTheDocument();
        expect(screen.getByText("Amy Lee")).toBeInTheDocument();
        expect(screen.getByText("Ben Ho").closest(".av-person")).toHaveClass("is-pending");
        expect(screen.getByText("Amy Lee").closest(".av-person")).not.toHaveClass("is-pending");
        expect(screen.getByText("From outside VSA")).toBeInTheDocument();
        expect(container.querySelector(".av-person-role")).toHaveTextContent("· ISA"); // guest role label
        expect(screen.queryByText("President")).not.toBeInTheDocument(); // officers' role label hidden
        expect(screen.getByLabelText("Note: late")).toBeInTheDocument();
        expect(container.querySelector(".av-person-remove")).toBeNull();
    });

    it("omits the outside section when there are no guests", () => {
        const people = responders().people.filter((p) => !p.guest);
        render(<RespondersPanel responders={responders({ guests: 0, people })} canManage={false} onRemove={() => {}} />);
        expect(screen.queryByText("From outside VSA")).not.toBeInTheDocument();
        expect(screen.queryByText(/from outside VSA/)).not.toBeInTheDocument();
    });

    it("guest without a role label renders just the name", () => {
        const people = [{ participantId: 9, name: "Zed", roleLabel: null, guest: true, responded: true, note: null }];
        render(<RespondersPanel responders={responders({ people })} canManage={false} onRemove={() => {}} />);
        expect(screen.getByText("Zed")).toBeInTheDocument();
    });

    it("managers can remove responders who answered (not pending people)", () => {
        const onRemove = vi.fn();
        render(<RespondersPanel responders={responders()} canManage onRemove={onRemove} />);

        expect(screen.queryByLabelText("Remove Ben Ho's response")).not.toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Remove Gus's response"));
        expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ participantId: 3, name: "Gus" }));
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });
});
