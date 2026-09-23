import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { loginUser } from "../api/auth";
import { getCurrentUserProfile } from "../api/User";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const refreshProfile = async () => {
        const profile = await getCurrentUserProfile();
        setUser(previous => ({
            ...previous,
            ...profile
        }));
        return profile;
    }
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                try {
                    const decodedToken = jwtDecode(savedToken);

                    const savedUser = {
                        email: decodedToken.sub,
                        role: decodedToken.role,
                    };

                    setToken(savedToken);
                    setUser(savedUser);
                    try {
                        await refreshProfile();
                    }
                    catch (err) {
                        console.error("Failed to load user profile", err);
                    }
                }
                catch (error) {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
            }
            setAuthLoading(false);
        };
        restoreSession();
    }, []);

    /*
    - This function is called in SignInPage.jsx to handle the user log-in inputs
        - It takes the email and password, and put them as parameters into the loginUser method, which is defined in "../auth.js"
        - Then, logInUser returns the token and message based on user account. (What logInUser returns can be found in "backend/src/main/java/com/vsa/controller/UserController.java - // POST /api/users/login" ).
        - In the token returned via loginUser by backend server, there's email and role associated with the user account.
        - Decode the token and take out the user's email and role with jwtDecode.
        - Store the token and the coressponding user in the localStorage of frontend. <-------- LATER, USE COOKIES TO STORE THIS FOR SERCURITY 
        - 
    */
    const login = async ({ email, password }) => {
        const data = await loginUser({ email, password });
        const decodedToken = jwtDecode(data.token);

        const loggedInUser = {
            email: decodedToken.sub,
            role: decodedToken.role,
        };

        localStorage.setItem("token", data.token);

        setToken(data.token);
        setUser(loggedInUser);

        return loggedInUser;
    }

    // Used after email verification, which returns a JWT directly instead of
    // going through loginUser -- decodes and stores it the same way login() does.
    const loginWithToken = (jwt) => {
        if (!jwt || typeof jwt !== "string") {
            throw new Error("A valid token is required.");
        }

        const decodedToken = jwtDecode(jwt);

        const loggedInUser = {
            email: decodedToken.sub,
            role: decodedToken.role,
        };

        localStorage.setItem("token", jwt);

        setToken(jwt);
        setUser(loggedInUser);

        return loggedInUser;
    }

    const logout = () => {
        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
    }

    const isAuthenticated = Boolean(token);


    return (
        <AuthContext.Provider value={{ user, token, authLoading, isAuthenticated, login, loginWithToken, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
}

