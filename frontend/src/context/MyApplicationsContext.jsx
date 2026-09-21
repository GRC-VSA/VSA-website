import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { getMyApplications, getMySubmittedApplicationReview } from "../api/Application.js";

const MyApplicationsContext = createContext(null);

export const MyApplicationsProvider = () => {

    /*
     * null means:
     * we haven't loaded applications yet.
     *
     * [] means:
     * loaded, but student has no applications.
     */
    const applicationsRef = useRef(null);

    const reviewsRef = useRef({});

    /*
     * Prevent duplicate requests if two components
     * request the same data at the same time.
     */
    const applicationsPromiseRef = useRef(null);

    const reviewPromisesRef = useRef(new Map());

    const [applications, setApplicationsState] = useState(null);

    const [reviewsById, setReviewsById] = useState({});


    const setApplications = useCallback(nextApplications => {
        applicationsRef.current = nextApplications;
        setApplicationsState(nextApplications);
    }, []);

    // APPLICATION LIST CACHE
    const loadMyApplications = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && applicationsRef.current !== null) {
            return applicationsRef.current;
        }
        if (!forceRefresh && applicationsPromiseRef.current) {
            return applicationsPromiseRef.current;
        }

        const request = getMyApplications()
            .then(data => {
                setApplications(data);
                return data;
            })
            .finally(() => { applicationsPromiseRef.current = null; });

        applicationsPromiseRef.current = request;
        return request;
    }, [setApplications]);


    // COMPLETED REVIEW CACHE

    const loadApplicationReview = useCallback(async (applicationId) => {
        const key = String(applicationId);
        if (reviewsRef.current[key]) {
            return reviewsRef.current[key];
        }
        const existingRequest = reviewPromisesRef.current.get(key);
        if (existingRequest) {
            return existingRequest;
        }

        const request = getMySubmittedApplicationReview(applicationId)
            .then(data => {
                const nextReviews = {
                    ...reviewsRef.current,
                    [key]: data
                };

                reviewsRef.current = nextReviews;
                setReviewsById(nextReviews);
                return data;
            })
            .finally(() => {
                reviewPromisesRef.current.delete(key);
            });

        reviewPromisesRef.current.set(key, request);
        return request;
    }, []);


    // UPDATE ONE APPLICATION IN CACHE
    const upsertApplication = useCallback(application => {
        /*
         * If the full list hasn't been loaded,
         * don't pretend one application is the
         * entire list.
         */
        if (applicationsRef.current === null) {
            return;
        }


        const nextApplications = [
            application,
            ...applicationsRef.current.filter(current => current.applicationId !== application.applicationId)
        ];


        nextApplications.sort((first, second) => {
            const firstDate =
                first.updatedAt ||
                first.submittedAt ||
                first.createdAt;

            const secondDate =
                second.updatedAt ||
                second.submittedAt ||
                second.createdAt;

            return (new Date(secondDate) - new Date(firstDate));
        }
        );


        setApplications(nextApplications);
    }, [setApplications]);


    return (
        <MyApplicationsContext.Provider
            value={{
                applications,
                reviewsById,

                loadMyApplications,
                loadApplicationReview,
                upsertApplication
            }}
        >
            <Outlet />
        </MyApplicationsContext.Provider>
    );

};


export const useMyApplications = () => {

    const context = useContext(MyApplicationsContext);
    if (!context) {
        throw new Error("useMyApplications must be used inside MyApplicationsProvider.");
    }
    return context;
};