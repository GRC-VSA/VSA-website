import { createContext, useCallback, useContext, useRef, useState } from "react";

import {
    getApplicationOverview,
    getApplicationRoles,
    getCompletedApplications,
    getSubmittedApplicationReview
} from "../api/Application.js";


const RecruitmentApplicantsContext = createContext(null);

export function RecruitmentApplicantsProvider({ children }) {

    // APPLICANTS LIST CACHE
    const [overview, setOverview] = useState(null);

    const [applications, setApplications] = useState([]);

    const [roles, setRoles] = useState([]);

    const [hasLoadedApplicants, setHasLoadedApplicants] = useState(false);

    const [loadingApplicants, setLoadingApplicants] = useState(false);


    /*
     * Refs are used so our functions can immediately know
     * whether data/request already exists without waiting
     * for a React re-render.
     */
    const hasLoadedApplicantsRef = useRef(false);

    const applicantsRequestRef = useRef(null);

    // APPLICATION REVIEW CACHE

    /*
     * Example:
     *
     * {
     *     "3": {...review for application 3},
     *     "7": {...review for application 7}
     * }
     */
    const [reviews, setReviews] = useState({});
    /*
     * Same cache, but immediately readable inside callbacks.
     */
    const reviewsRef = useRef({});
    /*
     * This tracks requests that are currently running and prevents:
     *
     * hover application 3
     * then click application 3
     *
     * from creating TWO backend requests.
     */
    const reviewRequestsRef =
        useRef({});


    // LOAD APPLICANTS PAGE DATA

    const loadApplicantsData = useCallback(async ({ force = false } = {}) => {
        if (hasLoadedApplicantsRef.current && !force) {
            return;
        }

        if (applicantsRequestRef.current && !force) {
            return applicantsRequestRef.current;
        }

        setLoadingApplicants(true);
        const request = Promise.all([
            getApplicationOverview(),
            getCompletedApplications(),
            getApplicationRoles()
        ])
            .then(
                ([overviewData, applicationsData, rolesData]) => {

                    setOverview(overviewData);

                    setApplications(applicationsData);

                    setRoles(rolesData);
                    hasLoadedApplicantsRef.current = true;
                    setHasLoadedApplicants(true);
                    return {
                        overview: overviewData,
                        applications: applicationsData,
                        roles: rolesData
                    };
                })
            .finally(() => {
                applicantsRequestRef.current = null;
                setLoadingApplicants(false);
            });


        applicantsRequestRef.current = request;
        return request;
    }, []);


    // LOAD ONE APPLICATION REVIEW

    const loadApplicationReview = useCallback(async (applicationId, { force = false } = {}) => {
        if (!applicationId) {
            throw new Error("Application ID is required.");
        }


        const key = String(applicationId);
        /*
         * Already cached.
         */
        if (reviewsRef.current[key] && !force) {
            return reviewsRef.current[key];
        }


        /*
         * The exact same application is already
         * being fetched, return the same Promise.
         */
        if (reviewRequestsRef.current[key] && !force) {
            return reviewRequestsRef.current[key];
        }
        const request = getSubmittedApplicationReview(applicationId)
            .then(data => {
                const updatedReviews = {
                    ...reviewsRef.current,
                    [key]: data
                };
                reviewsRef.current = updatedReviews;
                setReviews(updatedReviews);
                return data;
            })
            .finally(() => {
                delete reviewRequestsRef.current[key];
            });


        reviewRequestsRef.current[key] = request;
        return request;
    }, []);


    // PREFETCH ONE APPLICATION

    const prefetchApplicationReview = useCallback(applicationId => {
        if (!applicationId) {
            return;
        }
        const key = String(applicationId);
        if (reviewsRef.current[key] || reviewRequestsRef.current[key]) {
            return;
        }

        loadApplicationReview(applicationId).catch(() => { });
    }, [loadApplicationReview]);

    // PREFETCH MULTIPLE APPLICATIONS

    const prefetchApplicationReviews = useCallback(applicationIds => {
        if (!applicationIds) {
            return;
        }

        /*
         * Remove undefined values and duplicates.
         */
        const uniqueApplicationIds =
            [
                ...new Set(
                    applicationIds.filter(
                        Boolean
                    )
                )
            ];


        uniqueApplicationIds.forEach(applicationId => {
            prefetchApplicationReview(applicationId);
        }
        );
    }, [prefetchApplicationReview]
    );


    // MANUAL REFRESH
    const refreshApplicantsData = useCallback(async () => {
        return loadApplicantsData({ force: true });
    }, [loadApplicantsData]
    );


    const value = {
        overview,
        applications,
        roles,
        hasLoadedApplicants,
        loadingApplicants,
        loadApplicantsData,
        refreshApplicantsData,
        reviews,
        loadApplicationReview,
        prefetchApplicationReview,
        prefetchApplicationReviews
    };


    return (
        <RecruitmentApplicantsContext.Provider value={value}>
            {children}
        </RecruitmentApplicantsContext.Provider>
    );
}


export function useRecruitmentApplicants() {

    const context = useContext(RecruitmentApplicantsContext);
    if (!context) {
        throw new Error("useRecruitmentApplicants must be used inside RecruitmentApplicantsProvider.");
    }
    return context;
}