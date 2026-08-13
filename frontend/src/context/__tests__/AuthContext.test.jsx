import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import * as authApi from "../../api/auth";
import { jwtDecode } from "jwt-decode";

vi.mock("jwt-decode");
vi.mock("../../api/auth");

const TestConsumer = () => {
    const { user, isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <p data-testid="auth-status">{isAuthenticated ? "Authenticated" : "Guest"}</p>
            <p data-testid="user-email">{user?.email || "No Email"}</p>
            <p data-testid="user-role">{user?.role || "No Role"}</p>
            <button onClick={() => login({ email: "test@vsa.com", password: "password" })}>
                Log In
            </button>
            <button onClick={logout}>Log Out</button>
        </div>
    );
};

describe("AuthContext", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetAllMocks();
    });

    it("initializes as unauthenticated when localStorage is empty", () => {
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId("auth-status")).toHaveTextContent("Guest");
    });

    it("restores user session from existing valid token in localStorage", () => {
        localStorage.setItem("token", "valid-stored-token");
        jwtDecode.mockReturnValue({ sub: "saved@vsa.com", role: "OFFICER" });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId("auth-status")).toHaveTextContent("Authenticated");
        expect(screen.getByTestId("user-email")).toHaveTextContent("saved@vsa.com");
        expect(screen.getByTestId("user-role")).toHaveTextContent("OFFICER");
    });

    it("handles login flow successfully", async () => {
        authApi.loginUser.mockResolvedValueOnce({ token: "new-jwt-token" });
        jwtDecode.mockReturnValue({ sub: "logged@vsa.com", role: "MEMBER" });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByText("Log In").click();
        });

        expect(localStorage.getItem("token")).toBe("new-jwt-token");
        expect(screen.getByTestId("auth-status")).toHaveTextContent("Authenticated");
        expect(screen.getByTestId("user-email")).toHaveTextContent("logged@vsa.com");
    });

    it("clears user and token upon logout", () => {
        localStorage.setItem("token", "valid-stored-token");
        jwtDecode.mockReturnValue({ sub: "saved@vsa.com", role: "OFFICER" });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        act(() => {
            screen.getByText("Log Out").click();
        });

        expect(localStorage.getItem("token")).toBeNull();
        expect(screen.getByTestId("auth-status")).toHaveTextContent("Guest");
    });
});