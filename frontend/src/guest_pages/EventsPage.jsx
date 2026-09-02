import { useEvents } from "../context/EventsContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import React, { useState } from "react";
import Fuse from "fuse.js";
import "./EventsPage.css";

import coverPhoto from "../assets/guest/event_coverphoto.JPG";
import event_of_the_year from "../assets/guest/eventoftheyear.png";
import paz from "../assets/guest/paz.png";
import shawn from "../assets/guest/shawn.png";
import roni from "../assets/guest/Roni.png";
import anonymous_male from "../assets/guest/anonymous-male.png";
import ribbon from "../assets/guest/ribbon.png";
import choicau from "../assets/guest/choicau.jpg";
import badminton from "../assets/guest/badminton.JPG";
import tinhitle from "../assets/guest/tinhitle.jpg";
import lotusinthejadewell from "../assets/guest/lotusinthejadewell.jpg";
import midautumn from "../assets/guest/midautumn.jpg";
import tronhoc from "../assets/guest/tronhoc.jpg";
import foodtruck from "../assets/guest/foodtruck.jpg";
import makeyourchristmas from "../assets/guest/makeyourchristmas.jpg"
import doinhay from "../assets/guest/doinhay.jpg";
import noeventfound from "../assets/guest/noeventfound.png"

const EventsPage = () => {
    const { events, isLoading, error } = useEvents();

    const upcomingEvents = events.filter((event) => event.status === "upcoming" || event.status === "ongoing");
    // const ongoingEvents = events.filter((event) => event.status === "ongoing");
    const [hideSuggestion, setHideSuggestion] = useState(false);

    const [filterInput, setFilterInput] = useState({
        eventNameSearch: '',
        titleSearch: "all",
        quarterSearch: "all"
    });
    const [appliedSearch, setAppliedSearch] = useState({
        eventNameSearch: "",
        titleSearch: "all",
        quarterSearch: "all"
    });

    const mapDateToQuarter = (eventDate) => {
        if (!eventDate) return "all";

        const month = new Date(eventDate).getUTCMonth();

        if (month >= 0 && month <= 2) return "winter";
        if (month >= 3 && month <= 5) return "spring";
        if (month >= 6 && month <= 7) return "summer";
        if (month >= 8 && month <= 11) return "fall";

        return "all";
    };
    const normalizeText = (text) => {
        return text?.toLowerCase().trim().replace(/\s+/g, " ") || "";
    };

    const filteredEvents = upcomingEvents.filter((event) => {
        const eventName = normalizeText(event.eventName);
        const eventTitle = normalizeText(event.title); //Since event title is still hand-typed by officer when creating events. We need to normalize it

        const searchedName = normalizeText(appliedSearch.eventNameSearch);
        const searchedTitle = appliedSearch.titleSearch;
        const searchedQuarter = appliedSearch.quarterSearch;

        const eventQuarter = mapDateToQuarter(event.eventDate);
        const matchesName = searchedName === "" || eventName.includes(searchedName); //matchesName is true if searchedName === "" or eventName has searchedName
        const matchesTitle = searchedTitle === "all" || eventTitle === searchedTitle; //matchesTitle is true if searchedTitle === "all" or evenTitle === searchTitle
        const matchesQuarter = searchedQuarter === "all" || eventQuarter === searchedQuarter; // The same

        return matchesName && matchesTitle && matchesQuarter;
    });

    // Same scroll-reveal pattern as the homepage sections. The extra deps are
    // needed here (unlike HomePage) because this page returns a loading state
    // before <main> exists, and because filtering swaps out the event cards —
    // both change which .reveal elements are in the DOM.
    const sectionRef = useScrollReveal(".reveal", [isLoading, error, filteredEvents.length]);

    const didYouMean = () => {
        const searchedName = normalizeText(appliedSearch.eventNameSearch);

        if (searchedName === "") {
            return null;
        }

        if (filteredEvents.length >= 1) {
            return null;
        }

        const fuse = new Fuse(upcomingEvents, {
            keys: ["eventName"],
            threshold: 0.4,
        });

        const result = fuse.search(searchedName);

        if (result.length > 0) {
            return result[0].item.eventName;
        }
        return null;
    };
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFilterInput((prev) => ({
            ...prev, [name]: value
        }));
    };
    const handleSearch = (event) => {
        event.preventDefault();
        setAppliedSearch(filterInput);
        setHideSuggestion(false);
    }
    const handleClear = () => {
        setFilterInput({
            eventNameSearch: '',
            titleSearch: "all",
            quarterSearch: "all"
        });
        setAppliedSearch({
            eventNameSearch: '',
            titleSearch: "all",
            quarterSearch: "all"
        });
        setHideSuggestion(false);
    };

    const convert24hTo12h = (time) => {
        let period = "";
        if (!time) {
            return "";
        }
        else {
            const [hours, minutes] = time.split(":");
            if (+hours >= 12) {
                period = "PM";
            }
            else {
                period = "AM";
            }
            const newHour = +hours % 12 || 12;
            return `${newHour}:${minutes} ${period}`;
        }
    }

    const displayEventMonth = (eventDate) => {
        let month = "";
        if (!eventDate) {
            return "";
        }
        else {
            month = new Date(eventDate).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
            if (month.length >= 5) {
                return month.substring(0, 3).toUpperCase();
            }
            else {
                return month.toUpperCase();
            }
        }
    };

    // This method trims the event location if it's too long to fit in the event card
    // THis is just a temporary or second-check solution. We need to limit characters officer can put in location

    const trimEventLocation = (location) => {
        if (location.length >= 25) {
            let newLocation;
            if (location.includes("-")) {
                //If we have "Holman Library - Green River College", split("-") gives "Holman Library " and " Green River College".
                // Map and trim is to remove the space of each element.
                newLocation = location.split("-").map(word => word.trim());
                for (let i = 0; i < 2; i++) {
                    if (newLocation[i].length > 1) {
                        newLocation[i] = newLocation[i].split(" ").map(word => word.charAt(0).toUpperCase()).join('');
                    }
                }
                return `${newLocation[0]} - ${newLocation[1]}`;
            }
            else if (location.includes(",")) {
                newLocation = location.split(",");
                return `${newLocation[0]}, ${newLocation[1]}`;
            }
            else {
                return location.slice(0, 24);
            }
        }
        else {
            return location;
        }
    };

    //trim the description too. Yap less bud @.@
    const shortenDescription = (description) => {
        if (!description) {
            return "";
        }

        const words = description.trim().split(/\s+/);
        if (words.length > 25) {
            return words.slice(0, 20).join(" ") + "...";
        }

        return description;
    };
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    const suggestedEvent = hideSuggestion ? null : didYouMean();

    return (
        <main id="event-page-main" ref={sectionRef}>
            <div id="cover-photo-container">
                <img src={coverPhoto} id="cover-photo"></img>
                <div id="overlay"></div>
                <div className="cover-photo-text">
                    <span>VSA EVENTS</span>
                    <h1>Discover Events <br />that Bring
                        <span id="highlight-header"> Excitement</span>
                    </h1>
                    <span>Immerse in fun and exploration at our events</span>
                </div>
                <div id="search-bar-container">
                    <form id="search-bar" onSubmit={handleSearch}>
                        <div className="search-filter-container" style={{ gridArea: "event-name"}}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M160-200v-80h528l-42-42 56-56 138 138-138 138-56-56 42-42H160Zm116-200 164-440h80l164 440h-76l-38-112H392l-40 112h-76Zm138-176h132l-64-182h-4l-64 182Z" /></svg>
                            <div className="event-name-search">
                                <label>Event Name</label>
                                <input type="text" name="eventNameSearch" value={filterInput.eventNameSearch} onChange={handleChange}></input>
                            </div>
                        </div>
                        <div className="vertical-divider-search" style={{ gridArea: "divide-1"}}></div>
                        <div className="search-filter-container" style={{ gridArea: "category"}}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" /></svg>
                            <div className="event-category-search">
                                <label>Category</label>
                                <select name="titleSearch" value={filterInput.titleSearch} onChange={handleChange} >
                                    <option value="all">All</option>
                                    <option value="sport">Sport</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="club-meeting">Club Meeting</option>
                                    <option value="performance">Performance</option>
                                </select>
                            </div>
                        </div>
                        <div className="vertical-divider-search" style={{ gridArea: "divide-2"}}></div>
                        <div className="search-filter-container" style={{ gridArea: "quarter"}}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" /></svg>
                            <div className="event-quarter-search">
                                <label>Quarter</label>
                                <select name="quarterSearch" value={filterInput.quarterSearch} onChange={handleChange} >
                                    <option value="all">All</option>
                                    <option value="fall">Fall</option>
                                    <option value="winter">Winter</option>
                                    <option value="spring">Spring</option>
                                    <option value="summer">Summer</option>
                                </select>
                            </div>
                        </div>
                        <div className="buttons-div">
                            <div className="button-div" id="filter-button-div" style={{ gridArea: "filter"}}>
                                <button type="submit" form="search-bar" id="filter-button">Search</button>
                            </div>
                            <div className="button-div" id="clear-button-div" style={{ gridArea: "clear"}}>
                                <button type="button" onClick={handleClear} id="clear-button">Clear All</button>
                            </div>
                        </div>
                    </form>
                    {/* <div id="search-bar-horizontal-divider"></div> */}
                    <div id="applied-filter-container">
                        <p>Applied Filters</p>
                        <div id="filter-div">
                            {appliedSearch.eventNameSearch !== "" && (
                                <div className="filter">
                                    {appliedSearch.eventNameSearch}
                                    <div className="remove-filter-button" onClick={() => {
                                        setAppliedSearch((prev) => ({
                                            ...prev, eventNameSearch: ""
                                        }));
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                                    </div>
                                </div>
                            )}
                            {appliedSearch.titleSearch !== "all" && (
                                <div className="filter">
                                    {appliedSearch.titleSearch}
                                    <div className="remove-filter-button" onClick={() => {
                                        setAppliedSearch((prev) => ({
                                            ...prev, titleSearch: "all"
                                        }));
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                                    </div>
                                </div>
                            )}
                            {appliedSearch.quarterSearch !== "all" && (
                                <div className="filter">
                                    {appliedSearch.quarterSearch}
                                    <div className="remove-filter-button" onClick={() => {
                                        setAppliedSearch((prev) => ({
                                            ...prev, quarterSearch: "all"
                                        }));
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                                    </div>
                                </div>
                            )}
                            {appliedSearch.quarterSearch === "all" && appliedSearch.eventNameSearch === "" && appliedSearch.titleSearch === "all" && (
                                <div>
                                    <i>N/A</i>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div
                id="upcoming-events-title"
                className="section-title-container reveal">
                <h3 className="section-title">Upcoming Events</h3>
                <p className="section-description">Click and sign up for the closest events comming up.</p>
                <div className="horizontal-divider"></div>
            </div>
            <div className="event-card-container">
                {/* <h1>Upcoming Events</h1> */}
                {filteredEvents.map((event) => (
                    <div key={event.eventId} className="event-card reveal">
                        <div className="image-placeholder">
                            <img src={event.imageUrl} />
                            <div className="event-date">
                                <span>{new Date(event.eventDate).toLocaleDateString('en-US', { day: 'numeric', timezone: 'UTC' })}</span>
                                <span>{displayEventMonth(event.eventDate)}</span>
                            </div>
                        </div>
                        <div className="event-detail-placeholder">
                            <div className="event-main-info-div">
                                <h3>{event.eventName}</h3>
                            </div>
                            <p className="event-description">{shortenDescription(event.description)}</p>

                            <div className="time-location-div">
                                <div className="event-time-div">
                                    <div className="time-div">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800t140.5 28.5q65.5 28.5 114 77t77 114Q840-515 840-440t-28.5 140.5q-28.5 65.5-77 114t-114 77Q555-80 480-80t-140.5-28.5ZM480-440Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" /></svg>
                                        <span>{convert24hTo12h(event.startTime.slice(0, 5))}</span>
                                        <span> - </span>
                                        <span>{convert24hTo12h(event.endTime.slice(0, 5))}</span>
                                    </div>
                                </div>

                                {/* <button type="button">Register Now</button> */}
                                <div className="location-div">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" /></svg>
                                    <span>{trimEventLocation(event.location)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
                {filteredEvents.length === 0 && (
                    <div id="no-event-found-container" className="reveal">
                        <img id="no-event-found-img" src={noeventfound} />
                        <div id="no-event-all-text-container">
                            <h3 id="no-event-found-header">Oops! No Event Found.</h3>
                            <div id="no-event-found-description-container">
                                <p id="no-event-found-description">
                                    We can't find the event that you're looking for. Probably the filters you applied are getting out of hand.
                                </p>

                                {suggestedEvent && (
                                    <div id="suggestion-container">
                                        <p>Did you mean: {suggestedEvent}?</p>
                                        <div className="suggestion-button-div">
                                            <button type="button" id="accept-button"
                                                    onClick={() => {
                                                        setFilterInput({
                                                            eventNameSearch: suggestedEvent,
                                                            titleSearch: "all",
                                                            quarterSearch: "all"
                                                        });
                                                        setAppliedSearch({
                                                            eventNameSearch: suggestedEvent,
                                                            titleSearch: "all",
                                                            quarterSearch: "all"
                                                        });
                                                    }}>
                                                Yup! This is what I meant
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                                            </button>
                                            <button type="button" id="refuse-button" onClick={() => { setHideSuggestion(true) }}>
                                                Hell nah, bro!
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div id="red-banner">
                <div className="achievement-div">
                    <div className="achievement reveal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M40-160v-160q0-34 23.5-57t56.5-23h131q20 0 38 10t29 27q29 39 71.5 61t90.5 22q49 0 91.5-22t70.5-61q13-17 30.5-27t36.5-10h131q34 0 57 23t23 57v160H640v-91q-35 25-75.5 38T480-200q-43 0-84-13.5T320-252v92H40Zm440-160q-38 0-72-17.5T351-386q-17-25-42.5-39.5T253-440q22-37 93-58.5T480-520q63 0 134 21.5t93 58.5q-29 0-55 14.5T609-386q-22 32-56 49t-73 17ZM160-440q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T280-560q0 50-34.5 85T160-440Zm640 0q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T920-560q0 50-34.5 85T800-440ZM480-560q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-680q0 50-34.5 85T480-560Z" /></svg>
                        <h3>250+</h3>
                        <p>CONCURRENT PARTICIPANTS</p>
                        <span>We promise to bring new experience of joy through our events</span>
                    </div>
                    <div className="vertical-divider" id="first-div ider"></div>
                    <div className="achievement reveal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-80 120-436l200-244h320l200 244L480-80ZM183-680l-85-85 57-56 85 85-57 56Zm257-80v-120h80v120h-80Zm335 80-57-57 85-85 57 57-85 85ZM480-192l210-208H270l210 208ZM358-600l-99 120h442l-99-120H358Z" /></svg>
                        <h3>80%</h3>
                        <p>CHANCE OF WINNING PRIZE</p>
                        <span>Most of the students go home with an awesome prize</span>
                    </div>
                    <div className="vertical-divider" id="second-divider"></div>
                    <div className="achievement reveal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-800v-80h320v80H120Zm120 280v-160H120v-80h320v80H320v160h-80ZM548-96l-56-56 312-312 56 56L548-96Zm-11-241q-17-17-17-43t17-43q17-17 43-17t43 17q17 17 17 43t-17 43q-17 17-43 17t-43-17Zm200 200q-17-17-17-43t17-43q17-17 43-17t43 17q17 17 17 43t-17 43q-17 17-43 17t-43-17ZM549.5-549.5Q520-579 520-620t29.5-71.5Q579-722 620-722q12 0 21.5 1.5T660-716v-124q0-17 11.5-28.5T700-880h140v80H720v180q0 41-29.5 70.5T620-520q-41 0-70.5-29.5ZM220-80q-41 0-70.5-30.5T120-182q0-18 7.5-36.5T150-252l42-42-14-14q-15-15-22.5-32.5T148-378q0-41 29.5-70.5T248-478q41 0 70.5 29.5T348-378q0 20-6.5 37.5T320-308l-14 14 28 28 56-56 56 58-56 56 56 56-56 56-56-56-42 42q-15 15-33.5 22.5T220-80Zm28-270 14-14q3-3 4.5-6t1.5-8q0-9-6-14.5t-14-5.5q-8 0-14 5.5t-6 14.5q0 3 1.5 7t4.5 7l14 14Zm-30 190q3 0 8-1.5t8-4.5l44-42-28-28-44 42q-3 3-4.5 7t-1.5 9q0 8 5 13t13 5Z" /></svg>
                        <h3>+3</h3>
                        <p>EVENTS PER QUARTER</p>
                        <span>Excited to surprise you with a versatile of events</span>
                    </div>
                    <div className="vertical-divider" id="third-divider"></div>
                    <div className="achievement reveal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 80-80v-148q-26-15-43-50.5T500-500q0-58 26-99t64-41q37 0 63.5 41t26.5 99q0 47-17 82.5T620-368v128h100v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h100v-160q-26-6-43-27.5T280-477v-163h40v151h30v-151h40v151h30v-151h40v163q0 28-17 49.5T400-400v180l80 80Zm0-340Z" /></svg>
                        <h3>FREE</h3>
                        <p>FOOD &amp; DRINK</p>
                        <span>All of our big events serve free food and free Vietnamese cuisine</span>
                    </div>
                </div>
            </div>
            <div className="event-of-the-year">
                <div className="event-of-the-year-img-div reveal">
                    <img src={event_of_the_year}></img>
                </div>
                <div className="event-of-the-year-text-div reveal">
                    <div className="event-of-the-year-title-div">
                        <p id="quotation-mark">"</p>
                        <h2 id="flexing-title"><span>Club Event</span> of The Year</h2>
                        <p>2025 - 2026</p>
                    </div>
                    <div className="event-of-the-year-description-div">
                        <p>VSA “<span>Badminton Tournament 2026</span>” are recognized as:</p>
                        <div className="bullet-points">
                            <span>The Best Club Event</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#C22E2D   "><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
                        </div>
                        <div className="bullet-points">
                            <span>The Competition with the Biggest Prize Pool </span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#C22E2D"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
                        </div>
                        <div className="bullet-points">
                            <span>The Event with the Largest Marketing Campaign</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#C22E2D"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
                        </div>
                        <div className="bullet-points">
                            <span>The Only Competition with 2 stages: Swiss Stage &amp; Knockout Stage</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#C22E2D"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
                        </div>
                        <p>Join our next events and <span>experience the fun</span> yourself!</p>
                    </div>
                </div>
            </div>

            <div className="section-title-container reveal">
                <h3>Impressions of Faculties &amp; Attendees</h3>
                <p>How the supervisor and students felt about our events</p>
                <div className="horizontal-divider"></div>
            </div>
            <div className="accolade-container">
                <div className="accolade-column">
                    <div className="accolade reveal">
                        <div className="person">
                            <img src={paz}></img>
                            <div className="person-name-div">
                                <h3>Paz J. Clearwater</h3>
                                <p>Assistant Director of Student Life</p>
                            </div>
                        </div>
                        <p>
                            It has been great pleasure to work with the VSA team this year.
                            They have held some great events and put on an amazing performance at the last club fair! Way to go VSA!
                        </p>
                        <img src={ribbon}></img>
                    </div>
                    <div className="accolade reveal">
                        <div className="person">
                            <img src={roni}></img>
                            <div className="person-name-div">
                                <h3>Veronica (Roni) Zimmerman</h3>
                                <p>International Student Advisor</p>
                            </div>
                        </div>
                        <p>
                            Thank you! It was an amazing day. You all put in SO much work to prepare!!
                            <br />
                            <br />
                            And thank you for the cute photos!
                        </p>
                        <img src={ribbon}></img>
                    </div>
                </div>
                <div className="accolade-column">
                    <div className="accolade reveal">
                        <div className="person">
                            <img className="square-img" src={shawn}></img>
                            <div className="person-name-div">
                                <h3>Shawn Warner</h3>
                                <p>Assistant Director of Financial Aid</p>
                            </div>
                        </div>
                        <p>
                            I just wanted to send a quick note to say that I feel that the VSA students did an
                            outstanding job with their event on Saturday. It was clear how much thought, planning,
                            creativity, and hard work went into the day. As a supervisor I knew I was present to be
                            a support, but I ended up so engaged with the learning and fun that I enjoyed myself even
                            more than I thought I would. I was thoroughly impressed, I hope the VSA students are very
                            proud of the experience they created, and just wanted to share that with you.
                        </p>
                        <img src={ribbon}></img>
                    </div>

                </div>
                <div className="accolade-column">
                    <div className="accolade reveal">
                        <div className="person">
                            <img className="square-img" src={anonymous_male}></img>
                            <div className="person-name-div">
                                <h3>琉翔 Ryuuto</h3>
                                <p>Player at Badminton Tournament '26</p>
                            </div>
                        </div>
                        <p>
                            thankyou so much guys for hosting the tournament!!! It was so fun!!!
                            Thankyou Refs,Organizers, Social media Managers, and marketing outreach
                            people! You guys made it an unforgettable experience! ありがとうご ざいます！！
                        </p>
                        <img src={ribbon}></img>
                    </div>
                </div>
            </div>

            {/* <div className="section-wrapper"> */}
            <div id="memory-section">
                <div id="memory-title" className="section-title-container reveal">
                    <h3><span>Memories</span> with Students</h3>
                    <p>The fun we get along the journey</p>
                    <div className="horizontal-divider"></div>
                </div>
                {/* Revealed as one unit rather than per-.memory: if the carousel
                    track is CSS-animated, per-item GSAP transforms would fight it. */}
                <div className="memory-carousel reveal">
                    <div className="memory">
                        <img src={choicau} alt="diary of Viet students" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Diary of Viet students</p>

                        </div>
                    </div>
                    <div className="memory">
                        <img src={badminton} alt="badminton tournament" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Badminton Tournament 2026</p>

                        </div>
                    </div>
                    <div className="memory">
                        <img src={tinhitle} alt="Heritage Journey" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Heritage Journey</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={lotusinthejadewell} alt="lotus in the jade well" />
                        <div className="desc-holder">
                            <p><span>Performance: </span>Lotus in the Jade Well</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={midautumn} alt="Mid autumn festival" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Mid Autumn festival</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={tronhoc} alt="???" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Jailbreak???</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={foodtruck} alt="Foodtruck" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Banh mi Food truck</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={makeyourchristmas} alt="Make Your Christmas" />
                        <div className="desc-holder">
                            <p><span>Event: </span>Make Your Christmas</p>
                        </div>
                    </div>
                    <div className="memory">
                        <img src={doinhay} alt="Make Your Christmas" />
                        <div className="desc-holder">
                            <p><span>Performance: </span>Blossoms of Spring</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* </div> */}



        </main>
    );
};

export default EventsPage;