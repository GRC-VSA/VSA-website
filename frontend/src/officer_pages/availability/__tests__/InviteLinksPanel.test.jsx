import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import InviteLinksPanel from "../InviteLinksPanel.jsx";
import * as api from "../../../api/Availability.js";

vi.mock("../../../api/Availability.js", () => ({
    listInvites: vi.fn(),
    createInvite: vi.fn(),
    revokeInvite: vi.fn(),
    inviteUrl: (token) => `https://vsa.test/availability/invite/${token}`,
}));

const invite = (over = {}) => ({
    inviteId: 1, token: "tok1", label: "ISA", active: true, useCount: 1, maxUses: null, ...over,
});

describe("InviteLinksPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true });
    });
    afterEach(() => vi.useRealTimers());

    it("shows loading then the links with usage counts", async () => {
        api.listInvites.mockResolvedValue([invite(), invite({ inviteId: 2, token: "tok2", label: "Club", useCount: 2, maxUses: 5 })]);
        render(<InviteLinksPanel sheetId={5} canManage={false} />);

        expect(screen.getByText("Loading links…")).toBeInTheDocument();
        expect(await screen.findByLabelText("Link for ISA")).toHaveValue("https://vsa.test/availability/invite/tok1");
        expect(screen.getByText("1 response")).toBeInTheDocument();
        expect(screen.getByText("2 responses of 5")).toBeInTheDocument();
        expect(api.listInvites).toHaveBeenCalledWith(5);
        expect(screen.queryByText("Create link")).not.toBeInTheDocument();
        expect(screen.queryByText("Turn off")).not.toBeInTheDocument();
    });

    it("non-managers only see active links; managers see turned-off ones too", async () => {
        api.listInvites.mockResolvedValue([invite(), invite({ inviteId: 2, label: "Old", active: false })]);
        const { unmount } = render(<InviteLinksPanel sheetId={5} canManage={false} />);
        await screen.findByText("ISA");
        expect(screen.queryByText(/Old/)).not.toBeInTheDocument();
        unmount();

        render(<InviteLinksPanel sheetId={5} canManage />);
        expect(await screen.findByText("Old (off)")).toBeInTheDocument();
        expect(screen.queryByLabelText("Link for Old")).not.toBeInTheDocument();
    });

    it("shows an empty state", async () => {
        api.listInvites.mockResolvedValue([]);
        render(<InviteLinksPanel sheetId={5} canManage={false} />);
        expect(await screen.findByText("No links yet.")).toBeInTheDocument();
    });

    it("shows an error when links fail to load", async () => {
        api.listInvites.mockRejectedValue(new Error("boom"));
        render(<InviteLinksPanel sheetId={5} canManage={false} />);
        expect(await screen.findByText("boom")).toBeInTheDocument();
    });

    it("selects the link text when focused", async () => {
        api.listInvites.mockResolvedValue([invite()]);
        render(<InviteLinksPanel sheetId={5} canManage={false} />);
        const input = await screen.findByLabelText("Link for ISA");
        const select = vi.spyOn(input, "select");
        fireEvent.focus(input);
        expect(select).toHaveBeenCalled();
    });

    it("copies a link and resets the button label after 2 seconds", async () => {
        api.listInvites.mockResolvedValue([invite()]);
        render(<InviteLinksPanel sheetId={5} canManage={false} />);
        await screen.findByText("Copy link");

        vi.useFakeTimers({ shouldAdvanceTime: true });
        fireEvent.click(screen.getByText("Copy link"));
        expect(await screen.findByText("Copied")).toBeInTheDocument();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://vsa.test/availability/invite/tok1");

        await act(async () => {
            vi.advanceTimersByTime(2100);
        });
        expect(screen.getByText("Copy link")).toBeInTheDocument();
    });

    it("tells the user when the clipboard is blocked", async () => {
        navigator.clipboard.writeText.mockRejectedValue(new Error("denied"));
        api.listInvites.mockResolvedValue([invite()]);
        render(<InviteLinksPanel sheetId={5} canManage={false} />);
        fireEvent.click(await screen.findByText("Copy link"));
        expect(await screen.findByText(/Couldn't copy automatically/)).toBeInTheDocument();
    });

    it("creates a link with the typed label (or none) and clears the field", async () => {
        api.listInvites.mockResolvedValue([]);
        api.createInvite.mockResolvedValueOnce(invite({ inviteId: 7, label: "ISA", token: "new" }));
        api.createInvite.mockResolvedValueOnce(invite({ inviteId: 8, label: "Guest", token: "new2" }));
        render(<InviteLinksPanel sheetId={5} canManage />);
        await screen.findByText("No links yet.");

        const field = screen.getByLabelText("Who the new link is for");
        fireEvent.change(field, { target: { value: "  ISA  " } });
        fireEvent.click(screen.getByText("Create link"));
        expect(await screen.findByLabelText("Link for ISA")).toBeInTheDocument();
        expect(api.createInvite).toHaveBeenLastCalledWith(5, { label: "ISA" });
        expect(field).toHaveValue("");

        fireEvent.click(screen.getByText("Create link"));
        await screen.findByLabelText("Link for Guest");
        expect(api.createInvite).toHaveBeenLastCalledWith(5, { label: undefined });
    });

    it("shows an error when creating fails", async () => {
        api.listInvites.mockResolvedValue([]);
        api.createInvite.mockRejectedValue(new Error("nope"));
        render(<InviteLinksPanel sheetId={5} canManage />);
        await screen.findByText("No links yet.");
        fireEvent.click(screen.getByText("Create link"));
        expect(await screen.findByText("nope")).toBeInTheDocument();
        expect(screen.getByText("Create link")).not.toBeDisabled();
    });

    it("turns a link off after confirmation", async () => {
        api.listInvites.mockResolvedValue([invite()]);
        api.revokeInvite.mockResolvedValue(invite({ active: false }));
        vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
        render(<InviteLinksPanel sheetId={5} canManage />);

        fireEvent.click(await screen.findByText("Turn off"));
        expect(api.revokeInvite).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText("Turn off"));
        expect(await screen.findByText("ISA (off)")).toBeInTheDocument();
        expect(api.revokeInvite).toHaveBeenCalledWith(1);
    });

    it("shows an error when turning off fails", async () => {
        api.listInvites.mockResolvedValue([invite()]);
        api.revokeInvite.mockRejectedValue(new Error("cannot revoke"));
        vi.spyOn(window, "confirm").mockReturnValue(true);
        render(<InviteLinksPanel sheetId={5} canManage />);
        fireEvent.click(await screen.findByText("Turn off"));
        await waitFor(() => expect(screen.getByText("cannot revoke")).toBeInTheDocument());
    });
});
