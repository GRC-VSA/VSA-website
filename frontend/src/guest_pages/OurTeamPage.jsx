import { useEffect, useMemo, useState } from "react";
import { RiInstagramFill } from "react-icons/ri";
import { FaLinkedinIn } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";

import ourteamcover from "../assets/guest/ourteamcover2.jpg";
import "./OurTeamPage.css";
import { getOurTeam, createOfficer, deleteOfficer } from "../api/OurTeam.js";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { useAuth } from "../context/AuthContext.jsx";
import PhotoCropper from "../components/PhotoCropper.jsx";


const OurTeamPage = () => {

    const { user } = useAuth();
    useDocumentTitle("Our Team");
    const canManage =
        user?.role === "officer" || user?.role === "president";

    const [officers, setOfficers] = useState([]);
    const [currentGeneration, setCurrentGeneration] = useState(null);
    const [selectedOfficer, setSelectedOfficer] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [managementMode, setManagementMode] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [addFormData, setAddFormData] = useState({
        generation: "",
        officerName: "",
        officerPosition: "",
        officerQuote: "",
        officerInstagramUrl: "",
        officerLinkedinUrl: "",
        officerEmail: ""
    });

    const [officerImage, setOfficerImage] = useState(null);

    // const handleSaveAvatar = async (croppedFile) => {
    //     setSaving(true);
    //     setError("");
    //     setSuccess("");

    //     try {
    //         await uploadCurrentUserAvatar(croppedFile);
    //         await refreshProfile();
    //         setSuccess("Profile photo updated.");
    //     } finally {
    //         setSaving(false);
    //     }
    // };


    const loadOfficers = async () => {
        try {
            setIsLoading(true);
            setError("");

            const data = await getOurTeam();

            setOfficers(data);

        } catch (error) {
            console.error("Failed to load officers:", error);
            setError("Unable to load officers.");

        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        loadOfficers();
    }, []);


    const generations = useMemo(() => {

        const uniqueGenerations = [
            ...new Set(officers.map((officer) => officer.generation))
        ];

        return uniqueGenerations.sort((a, b) => a - b);

    }, [officers]);


    useEffect(() => {

        if (generations.length === 0) {
            setCurrentGeneration(null);
            return;
        }

        setCurrentGeneration((previousGeneration) => {

            if (previousGeneration !== null && generations.includes(previousGeneration)) {
                return previousGeneration;
            }
            return generations[generations.length - 1];
        });

    }, [generations]);


    const currentOfficers = useMemo(() => {

        if (currentGeneration === null) {
            return [];
        }

        return officers.filter(
            (officer) => officer.generation === currentGeneration
        );

    }, [officers, currentGeneration]);


    useEffect(() => {

        if (currentOfficers.length === 0) {
            setSelectedOfficer(null);
            return;
        }

        setSelectedOfficer((previousOfficer) => {

            const stillExists = currentOfficers.find(
                (officer) => officer.ourTeamId === previousOfficer?.ourTeamId
            );

            if (stillExists) {
                return stillExists;
            }

            const president = currentOfficers.find(
                (officer) => officer.officerPosition === "President"
            );

            return president || currentOfficers[0];
        });

    }, [currentOfficers]);


    const currentGenerationIndex = generations.indexOf(currentGeneration);


    const canGoPreviousGeneration =
        currentGenerationIndex > 0;


    const canGoNextGeneration = currentGenerationIndex !== -1 && currentGenerationIndex < generations.length - 1;


    const handlePreviousGeneration = () => {

        if (!canGoPreviousGeneration) {
            return;
        }

        setCurrentGeneration(generations[currentGenerationIndex - 1]);

        setSelectedOfficer(null);
    };


    const handleNextGeneration = () => {

        if (!canGoNextGeneration) {
            return;
        }

        setCurrentGeneration(generations[currentGenerationIndex + 1]);

        setSelectedOfficer(null);
    };


    const handleAddMode = () => {

        setManagementMode("add");
        setShowAddForm(true);

        setAddFormData({
            generation: currentGeneration ?? "",
            officerName: "",
            officerPosition: "",
            officerQuote: "",
            officerInstagramUrl: "",
            officerLinkedinUrl: "",
            officerEmail: ""
        });

        setOfficerImage(null);
    };


    const handleDeleteMode = () => {
        setManagementMode("delete");
        setShowAddForm(false);
    };


    const handleDone = () => {
        setManagementMode(null);
        setShowAddForm(false);
    };


    const handleAddFormChange = (event) => {

        const { name, value } = event.target;

        setAddFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };


    const handleImageChange = (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setOfficerImage(file);
    };


    const handleCreateOfficer = async (event) => {

        event.preventDefault();

        if (!officerImage) {
            alert("Please upload an officer image.");
            return;
        }

        try {
            setIsSubmitting(true);

            const officerData = {
                ...addFormData,
                generation: Number(addFormData.generation)
            };

            const createdOfficer =
                await createOfficer(
                    officerData,
                    officerImage
                );

            setOfficers((previousOfficers) => [
                ...previousOfficers,
                createdOfficer
            ]);

            setCurrentGeneration(createdOfficer.generation);
            setSelectedOfficer(createdOfficer);

            setShowAddForm(false);

            setAddFormData({
                generation: "",
                officerName: "",
                officerPosition: "",
                officerQuote: "",
                officerInstagramUrl: "",
                officerLinkedinUrl: "",
                officerEmail: ""
            });

            setOfficerImage(null);

        } catch (error) {
            console.error(
                "Failed to create officer:",
                error
            );

            alert(
                "Something went wrong while adding the officer."
            );

        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteOfficer = async (event, officerId) => {

        event.stopPropagation();

        try {

            await deleteOfficer(officerId);

            setOfficers((previousOfficers) =>
                previousOfficers.filter((officer) =>
                    officer.ourTeamId !== officerId
                )
            );

        } catch (error) {
            console.error("Failed to delete officer:", error);

            alert("Something went wrong while deleting the officer.");
        }
    };


    return (
        <main className="page-footer-space">

            <div id="cover-photo-container">

                <img
                    src={ourteamcover}
                    id="cover-photo"
                    alt="Vietnamese Student Association officers"
                />

                <div id="our-team-overlay"></div>

                <div className="cover-photo-text">

                    <span>VSA OFFICERS</span>

                    <h1>
                        OUR
                        <span id="highlight-header">
                            {" "}TEAM
                        </span>
                    </h1>

                    <div className="horizontal-slash"></div>

                    <span className="our-team-hero-description">
                        Meet the passionate people behind VSA
                        that make dreams come true
                    </span>

                </div>

            </div>


            <section id="our-team-section">

                <div className="generation-header">

                    <button
                        type="button"
                        className="generation-arrow"
                        onClick={handlePreviousGeneration}
                        disabled={!canGoPreviousGeneration}
                        aria-label="Previous generation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" /></svg>
                    </button>

                    <h2>
                        {currentGeneration !== null ? `Gen ${currentGeneration}` : "VSA"}
                    </h2>

                    <button
                        type="button"
                        className="generation-arrow"
                        onClick={handleNextGeneration}
                        disabled={!canGoNextGeneration}
                        aria-label="Next generation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" /></svg>
                    </button>

                </div>


                {canManage && (
                    <div className="team-management-buttons">

                        <button type="button" onClick={handleAddMode} className="team-manage-button">
                            Add
                        </button>

                        <button type="button" onClick={handleDeleteMode} className="team-manage-button" >
                            Delete
                        </button>

                        {managementMode && (
                            <button type="button" onClick={handleDone} className="team-manage-button done-button">
                                Done
                            </button>
                        )}

                    </div>
                )}


                {showAddForm && canManage && (
                    <div className="add-officer-overlay">

                        <div className="add-officer-modal">

                            <button type="button" className="close-add-officer" onClick={() => setShowAddForm(false)} aria-label="Close add officer form" >
                                ×
                            </button>

                            <h2>Add Officer</h2>

                            <form onSubmit={handleCreateOfficer} className="add-officer-form" >

                                <label>
                                    Generation
                                    <input
                                        type="number"
                                        name="generation"
                                        min="1"
                                        required
                                        value={
                                            addFormData.generation
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    Officer Name
                                    <input
                                        type="text"
                                        name="officerName"
                                        required
                                        value={
                                            addFormData.officerName
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    Officer Position

                                    <select
                                        name="officerPosition"
                                        required
                                        value={
                                            addFormData.officerPosition
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    >

                                        <option value="">
                                            Select position
                                        </option>

                                        <option value="President">
                                            President
                                        </option>

                                        <option value="Vice President">
                                            Vice President
                                        </option>

                                        <option value="Head of Event Organizer">
                                            Head of Event Organizer
                                        </option>

                                        <option value="Marketing Strategist">
                                            Marketing Strategist
                                        </option>

                                        <option value="Performing Art Director">
                                            Performing Art Director
                                        </option>

                                        <option value="Event Organizer">
                                            Event Organizer
                                        </option>

                                        <option value="Social Media Manager">
                                            Social Media Manager
                                        </option>

                                    </select>

                                </label>


                                <label>
                                    Officer Quote

                                    <textarea
                                        name="officerQuote"
                                        required
                                        value={
                                            addFormData.officerQuote
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    Instagram URL

                                    <input
                                        type="url"
                                        name="officerInstagramUrl"
                                        value={
                                            addFormData.officerInstagramUrl
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    LinkedIn URL

                                    <input
                                        type="url"
                                        name="officerLinkedinUrl"
                                        value={
                                            addFormData.officerLinkedinUrl
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    Email

                                    <input
                                        type="email"
                                        name="officerEmail"
                                        value={
                                            addFormData.officerEmail
                                        }
                                        onChange={
                                            handleAddFormChange
                                        }
                                    />
                                </label>


                                <label>
                                    Officer Image
{/* 
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={
                                            handleImageChange
                                        }
                                    />
                                        // Inside profile-avatar-actions: */}
                                    <PhotoCropper
                                        onSave={setOfficerImage}
                                        // disabled={saving}
                                        buttonText="Choose officer image"
                                        title="Adjust officer image"
                                    />
                                </label>


                                <button
                                    type="submit"
                                    className="add-officer-submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Adding..."
                                        : "Add Officer"}
                                </button>

                            </form>

                        </div>

                    </div>
                )}


                {isLoading && (
                    <p className="our-team-status">
                        Loading officers...
                    </p>
                )}


                {!isLoading && error && (
                    <p className="our-team-status">
                        {error}
                    </p>
                )}


                {!isLoading &&
                    !error &&
                    currentOfficers.length === 0 && (
                        <p className="our-team-status">
                            No officers found.
                        </p>
                    )}


                {!isLoading &&
                    !error &&
                    selectedOfficer && (
                        <>

                            <div className="featured-officer">

                                <div className="featured-officer-image-container">

                                    <img
                                        src={
                                            selectedOfficer.officerImage
                                        }
                                        alt={
                                            selectedOfficer.officerName
                                        }
                                        className="featured-officer-image"
                                    />

                                </div>


                                <div className="featured-officer-info">

                                    <p className="featured-officer-position">
                                        {
                                            selectedOfficer.officerPosition
                                        }
                                    </p>

                                    <h2>
                                        {
                                            selectedOfficer.officerName
                                        }
                                    </h2>

                                    <p className="featured-officer-quote">
                                        “
                                        {
                                            selectedOfficer.officerQuote
                                        }
                                        ”
                                    </p>


                                    <div className="featured-officer-socials">

                                        {selectedOfficer.officerInstagramUrl && (
                                            <a
                                                href={
                                                    selectedOfficer.officerInstagramUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <RiInstagramFill />
                                            </a>
                                        )}


                                        {selectedOfficer.officerLinkedinUrl && (
                                            <a
                                                href={
                                                    selectedOfficer.officerLinkedinUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FaLinkedinIn />
                                            </a>
                                        )}


                                        {selectedOfficer.officerEmail && (
                                            <a
                                                href={`mailto:${selectedOfficer.officerEmail}`}
                                            >
                                                <IoMdMail />
                                            </a>
                                        )}

                                    </div>

                                </div>

                            </div>


                            <div className="officer-card-list">

                                {currentOfficers.map(
                                    (officer) => {

                                        const isSelected =
                                            officer.ourTeamId ===
                                            selectedOfficer.ourTeamId;

                                        return (
                                            <button
                                                type="button"
                                                key={officer.ourTeamId}
                                                className={
                                                    `officer-card ${isSelected
                                                        ? "officer-card-selected"
                                                        : ""
                                                    }`
                                                }
                                                onClick={() => setSelectedOfficer(officer)}
                                            >

                                                {managementMode ===
                                                    "delete" &&
                                                    canManage && (
                                                        <span
                                                            role="button"
                                                            tabIndex="0"
                                                            className="delete-officer-button"
                                                            onClick={(event) => handleDeleteOfficer(event, officer.ourTeamId)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Enter" || event.key === " ") {
                                                                    handleDeleteOfficer(event, officer.ourTeamId);
                                                                }
                                                            }}
                                                        >
                                                            ×
                                                        </span>
                                                    )}


                                                <img src={officer.officerImage} alt={officer.officerName} className="officer-card-image" />

                                                <div className="officer-card-info">

                                                    <h3>
                                                        {
                                                            officer.officerName
                                                        }
                                                    </h3>

                                                    <p>
                                                        {
                                                            officer.officerPosition
                                                        }
                                                    </p>

                                                </div>

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                        </>
                    )}

            </section>

        </main>
    );
};


export default OurTeamPage;