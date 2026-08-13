import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ProtectedRoute from "../ProtectedRoute";
import * as AuthContextModule from "../../context/AuthContext";

vi.mock("../../context/AuthContext");

const setupRender = (allowedRoles = null) => {
    render(
        <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
                <Route path="/sign-in" element={<div>Sign In Page</div>} />
                <Route path="/" element={<div>Home Page</div>} />
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute allowedRoles={allowedRoles}>
                            <div>Secret Dashboard Content</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
};

describe("ProtectedRoute Component", () => {
    it("redirects unauthenticated users to /sign-in", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            isAuthenticated: false,
            user: null,
        });

        setupRender();

        expect(screen.getByText("Sign In Page")).toBeInTheDocument();
        expect(screen.queryByText("Secret Dashboard Content")).not.toBeInTheDocument();
    });

    it("redirects authenticated users without the required role to Home Page", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            isAuthenticated: true,
            user: { email: "member@vsa.com", role: "MEMBER" },
        });

        setupRender(["OFFICER", "ADMIN"]);

        expect(screen.getByText("Home Page")).toBeInTheDocument();
        expect(screen.queryByText("Secret Dashboard Content")).not.toBeInTheDocument();
    });

    it("renders children when user is authenticated and has permitted role", () => {
        vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
            isAuthenticated: true,
            user: { email: "officer@vsa.com", role: "OFFICER" },
        });

        setupRender(["OFFICER"]);

        expect(screen.getByText("Secret Dashboard Content")).toBeInTheDocument();
    });
});