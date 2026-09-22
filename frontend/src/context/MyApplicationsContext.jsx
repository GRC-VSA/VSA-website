import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import {
    getMyApplications, getMyApplication, getMySubmittedApplicationReview,
    getRecruitmentStatus, getOpenApplicationRoles
} from "../api/Application.js";

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
    const applicationsByIdRef = useRef({});

    const oneApplicationPromisesRef = useRef(new Map());

    const [applicationsById, setApplicationsById] = useState({});

    const applyPageDataRef = useRef(null);

    const applyPagePromiseRef = useRef(null);

    const [applyPageData, setApplyPageData] = useState(null);
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
        const key = String(application.applicationId);
        const nextApplicationsById = {
            ...applicationsByIdRef.current,
            [key]: application
        };
        applicationsByIdRef.current = nextApplicationsById;
        setApplicationsById(nextApplicationsById);
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

    const loadMyApplication = useCallback(async (applicationId) => {
        const key = String(applicationId);


        if (applicationsByIdRef.current[key]) {
            return applicationsByIdRef.current[key];
        }


        const existingRequest = oneApplicationPromisesRef.current.get(key);
        if (existingRequest) {
            return existingRequest;
        }


        const request = getMyApplication(applicationId)
            .then(data => {

                const nextApplications = {
                    ...applicationsByIdRef.current,
                    [key]: data
                };

                applicationsByIdRef.current = nextApplications;
                setApplicationsById(nextApplications);
                return data;
            })
            .finally(() => {
                oneApplicationPromisesRef.current.delete(key);
            });


        oneApplicationPromisesRef.current.set(key, request);
        return request;
    }, []);


    const loadApplyPageData = useCallback(async () => {
        if (applyPageDataRef.current) {
            return applyPageDataRef.current;
        }

        if (applyPagePromiseRef.current) {
            return applyPagePromiseRef.current;
        }

        const request = Promise.all([getRecruitmentStatus(), getOpenApplicationRoles()])
            .then(
                ([recruitmentStatus, openRoles]) => {
                    const data = { recruitmentStatus, openRoles };
                    applyPageDataRef.current = data;
                    setApplyPageData(data);
                    return data;
                }
            )
            .finally(() => {
                applyPagePromiseRef.current = null;
            });


        applyPagePromiseRef.current = request;
        return request;

    }, []);
    return (
        <MyApplicationsContext.Provider
            value={{
                applications,
                applicationsById,
                applyPageData,
                reviewsById,
                loadMyApplication,
                loadMyApplications,
                loadApplicationReview,
                loadApplyPageData,
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