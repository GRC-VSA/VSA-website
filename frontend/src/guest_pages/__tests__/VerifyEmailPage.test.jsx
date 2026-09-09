import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import VerifyEmailPage from "../VerifyEmailPage";
import * as authApi from "../../api/auth";
import * as AuthContextModule from "../../context/AuthContext.jsx";

vi.mock("../../api/auth");
vi.mock("../../context/AuthContext.jsx");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderWithState = (state) => {
    return render(
        <MemoryRouter initialEntries={[{ pathname: "/verify", state }]}>
            <VerifyEmailPage />
        </MemoryRouter>
    );
};

describe("VerifyEmailPage", () => {
    const mockLoginWithToken = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            loginWithToken: mockLoginWithToken,
        });
    });

    it("asks for email to recover the flow when there is no verificationId", () => {
        renderWithState(undefined);

        expect(
            screen.getByText(/Enter the email you signed up with/i)
        ).toBeInTheDocument();
    });

    it("signs the user in via AuthContext and navigates home on successful verification", async () => {
        authApi.verifyEmailCode.mockResolvedValueOnce({ token: "a-valid-jwt" });

        renderWithState({ verificationId: "vid-123", maskedEmail: "j***n@vsa.com" });

        fireEvent.change(screen.getByLabelText(/Verification code/i), {
            target: { value: "ABCDEFGH" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

        await waitFor(() => {
            expect(authApi.verifyEmailCode).toHaveBeenCalledWith({
                verificationId: "vid-123",
                code: "ABCDEFGH",
            });
            expect(mockLoginWithToken).toHaveBeenCalledWith("a-valid-jwt");
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });

    it("does not sign in or navigate when verification fails", async () => {
        authApi.verifyEmailCode.mockRejectedValueOnce(new Error("Invalid code."));

        renderWithState({ verificationId: "vid-123", maskedEmail: "j***n@vsa.com" });

        fireEvent.change(screen.getByLabelText(/Verification code/i), {
            target: { value: "ABCDEFGH" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

        await waitFor(() => {
            expect(screen.getByText("Invalid code.")).toBeInTheDocument();
        });

        expect(mockLoginWithToken).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not sign in or navigate when the response is missing a token", async () => {
        authApi.verifyEmailCode.mockResolvedValueOnce({});

        renderWithState({ verificationId: "vid-123", maskedEmail: "j***n@vsa.com" });

        fireEvent.change(screen.getByLabelText(/Verification code/i), {
            target: { value: "ABCDEFGH" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

        await waitFor(() => {
            expect(screen.getByText("Email verification failed.")).toBeInTheDocument();
        });

        expect(mockLoginWithToken).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
