import { useEffect, useState } from "react";

import {
    getSponsors,
    createSponsor,
    deleteSponsor
} from "../api/Sponsor.js";

import { useAuth } from "../context/AuthContext.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

import "./SponsorsPage.css";


const SponsorsPage = () => {
    useDocumentTitle("Sponsors");
    const { user } = useAuth();

    const canManage =
        user?.role === "officer" ||
        user?.role === "president";


    const [sponsors, setSponsors] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    /*
     * null     = normal viewing mode
     * "add"    = Add Sponsor popup is open
     * "delete" = delete buttons are visible
     */
    const [managementMode, setManagementMode] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        year: "",
        description: "",
        websiteUrl: "",
        image: null
    });


    useEffect(() => {

        async function loadSponsors() {

            try {

                setLoading(true);
                setError("");

                const data = await getSponsors();

                setSponsors(data);

            }
            catch (err) {

                console.error(err);

                setError(
                    err.message ||
                    "Failed to load sponsors."
                );

            }
            finally {

                setLoading(false);

            }
        }


        loadSponsors();

    }, []);


    function handleAddMode() {
        setFormError("");
        setFormData({
            name: "",
            year: "",
            description: "",
            websiteUrl: "",
            image: null
        });

        setManagementMode("add");
    }


    function handleDeleteMode() {

        setManagementMode("delete");
    }


    function handleDone() {

        setManagementMode(null);
        setFormError("");

        setFormData({
            name: "",
            year: "",
            description: "",
            websiteUrl: "",
            image: null
        });
    }


    function handleInputChange(event) {

        const { name, value } = event.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    }


    function handleImageChange(event) {

        const file = event.target.files?.[0] || null;

        setFormData(previous => ({
            ...previous,
            image: file
        }));
    }


    async function handleSubmit(event) {

        event.preventDefault();

        setFormError("");


        if (!formData.name.trim()) {
            setFormError("Sponsor name is required.");
            return;
        }


        if (!formData.image) {
            setFormError("Sponsor logo is required.");
            return;
        }


        try {

            setIsSubmitting(true);

            const sponsorData = {
                name: formData.name.trim(),

                websiteUrl:
                    formData.websiteUrl.trim() || null,

                description:
                    formData.description.trim() || null,

                year:
                    formData.year
                        ? Number(formData.year)
                        : null
            };


            const createdSponsor =
                await createSponsor(
                    sponsorData,
                    formData.image
                );

            setSponsors(previous => [
                ...previous,
                createdSponsor
            ]);


            /*
             * Return to normal viewing mode after
             * successfully creating a sponsor.
             */
            setManagementMode(null);

            setFormData({
                name: "",
                year: "",
                description: "",
                websiteUrl: "",
                image: null
            });

        }
        catch (err) {

            console.error(err);

            setFormError(
                err.message ||
                "Failed to add sponsor."
            );

        }
        finally {

            setIsSubmitting(false);

        }
    }


    async function handleDeleteSponsor(sponsorId) {

        try {

            await deleteSponsor(sponsorId);

            setSponsors(previous =>
                previous.filter(
                    sponsor =>
                        sponsor.sponsorId !== sponsorId
                )
            );

        }
        catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Failed to delete sponsor."
            );

        }
    }


    return (
        <main className="sponsors-page page-footer-space">

            <section className="sponsors-hero">

                <div className="sponsors-hero-content">

                    <p className="sponsors-hero-eyebrow">
                        COMMUNITY • CULTURE • OPPORTUNITY
                    </p>

                    <h1>
                        Our Sponsors
                    </h1>

                    <p className="sponsors-hero-subtitle">
                        VSA is honored to be sponsored by
                    </p>

                </div>

            </section>

            <section className="sponsors-content">

                {canManage && (

                    <div className="sponsor-management-controls">

                        {managementMode === null ? (
                            <>
                                <button
                                    type="button"
                                    className="sponsor-management-button"
                                    onClick={handleAddMode}
                                >
                                    Add
                                </button>

                                <button
                                    type="button"
                                    className="sponsor-management-button"
                                    onClick={handleDeleteMode}
                                >
                                    Delete
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="sponsor-management-button sponsor-management-button--done"
                                onClick={handleDone}
                            >
                                Done
                            </button>
                        )}

                    </div>

                )}


                {loading && (

                    <p className="sponsors-status">
                        Loading sponsors...
                    </p>

                )}


                {error && (

                    <p className="sponsors-error">
                        {error}
                    </p>

                )}


                {!loading &&
                    !error &&
                    sponsors.length === 0 && (

                        <p className="sponsors-status">
                            No sponsors have been added yet.
                        </p>

                    )}


                {!loading &&
                    sponsors.map((sponsor, index) => {

                        const reverse =
                            index % 2 !== 0;

                        return (

                            <article
                                key={sponsor.sponsorId}
                                className={
                                    `sponsor-row ${
                                        reverse
                                            ? "sponsor-row--reverse"
                                            : ""
                                    }`
                                }
                            >

                                {managementMode === "delete" && (

                                    <button
                                        type="button"
                                        className="sponsor-delete-button"
                                        aria-label={`Delete ${sponsor.name}`}
                                        onClick={() =>
                                            handleDeleteSponsor(
                                                sponsor.sponsorId
                                            )
                                        }
                                    >
                                        ×
                                    </button>

                                )}


                                <div className="sponsor-logo-section">

                                    <img
                                        src={sponsor.logoUrl}
                                        alt={`${sponsor.name} logo`}
                                        className="sponsor-logo"
                                    />

                                </div>


                                <div className="sponsor-information">

                                    {sponsor.year && (

                                        <div className="sponsor-since">

                                            <span
                                                className="sponsor-since-line"
                                                aria-hidden="true"
                                            />

                                            <span>
                                                Since {sponsor.year}
                                            </span>

                                        </div>

                                    )}


                                    <h2 className="sponsor-name">
                                        {sponsor.name}
                                    </h2>


                                    {sponsor.description && (

                                        <p className="sponsor-description">
                                            {sponsor.description}
                                        </p>

                                    )}


                                    {sponsor.websiteUrl && (

                                        <a
                                            href={sponsor.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="sponsor-learn-more"
                                        >
                                            Learn More
                                            <span aria-hidden="true">
                                                {" "}→
                                            </span>
                                        </a>

                                    )}

                                </div>

                            </article>

                        );
                    })}

            </section>


            {managementMode === "add" && (

                <div className="sponsor-modal-overlay">

                    <div
                        className="sponsor-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-sponsor-title"
                    >

                        <button
                            type="button"
                            className="sponsor-modal-close"
                            aria-label="Close Add Sponsor form"
                            onClick={handleDone}
                        >
                            ×
                        </button>


                        <div className="sponsor-modal-heading">

                            <p>
                                Sponsor Management
                            </p>

                            <h2 id="add-sponsor-title">
                                Add Sponsor
                            </h2>

                        </div>


                        <form
                            className="sponsor-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="sponsor-form-field">

                                <label htmlFor="sponsor-name">
                                    Sponsor Name
                                </label>

                                <input
                                    id="sponsor-name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Sponsor name"
                                    required
                                />

                            </div>


                            <div className="sponsor-form-field">

                                <label htmlFor="sponsor-year">
                                    Sponsor Since
                                </label>

                                <input
                                    id="sponsor-year"
                                    name="year"
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    step="1"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    placeholder="2024"
                                />

                            </div>


                            <div className="sponsor-form-field sponsor-form-field--full">

                                <label htmlFor="sponsor-description">
                                    Description
                                </label>

                                <textarea
                                    id="sponsor-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Tell visitors about this sponsor..."
                                    rows="5"
                                />

                            </div>


                            <div className="sponsor-form-field sponsor-form-field--full">

                                <label htmlFor="sponsor-website">
                                    Sponsor Website URL
                                </label>

                                <input
                                    id="sponsor-website"
                                    name="websiteUrl"
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com"
                                />

                            </div>


                            <div className="sponsor-form-field sponsor-form-field--full">

                                <label htmlFor="sponsor-logo">
                                    Sponsor Logo
                                </label>

                                <input
                                    id="sponsor-logo"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required
                                />

                            </div>


                            {formError && (

                                <p className="sponsor-form-error">
                                    {formError}
                                </p>

                            )}


                            <div className="sponsor-form-actions">

                                <button
                                    type="button"
                                    className="sponsor-form-cancel"
                                    onClick={handleDone}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="sponsor-form-submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Adding..."
                                        : "Add Sponsor"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </main>
    );
}
export default SponsorsPage;