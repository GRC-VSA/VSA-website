import { useEffect, useState, useRef } from "react";
import { useEvents } from "../context/EventsContext.jsx"
import "./HomePage.css";

const AUTO_SWIPE_NEXT_TIME_INTERVALS = 10000; //10 seconds
const TRANSITION_DURATION = 500; //0.5 second
const HomePage = () => {

    const { events, isLoading, error } = useEvents();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(null);
    const [animationDirection, setAnimationDirection] = useState("right");
    const preloadedImagesRef = useRef([]);

    const cleanupTimerRef = useRef(null);

    const handlePrevious = () => {
        let newIndex = 0;
        if (currentIndex === 0) {
            newIndex = events.length - 1;
        }
        else {
            newIndex = currentIndex -1;
        }
        setPreviousIndex(currentIndex);
        setCurrentIndex(newIndex);
        setAnimationDirection("left");

        // Clear the old timer if it exists.
        if (cleanupTimerRef.current) {
            clearTimeout(cleanupTimerRef.current);
        }

        // Set up a new timer of {TRANSITION_DURATION} seconds that will set the Previous Index to "null",
        // meaning unmount the previous events after {TRANSITION_DURATION} seconds
        cleanupTimerRef.current = setTimeout(() => {
            setPreviousIndex(null);
        }, TRANSITION_DURATION);
        
    };

    const handleNext = () => {
        let newIndex = 0;
        if (currentIndex === events.length - 1) {
            newIndex = 0;
        }
        else {
            newIndex = currentIndex + 1;
        }
        setPreviousIndex(currentIndex);
        setCurrentIndex(newIndex);
        setAnimationDirection("right");

        // Clear the old timer if it exists.
        if (cleanupTimerRef.current) {
            clearTimeout(cleanupTimerRef.current);
        }

        // Set up a new timer of {TRANSITION_DURATION} seconds that will set the Previous Index to "null",
        // meaning unmount the previous events after {TRANSITION_DURATION} seconds
        cleanupTimerRef.current = setTimeout(() => {
            setPreviousIndex(null);
        }, TRANSITION_DURATION);
    };
    useEffect(() => {
        if (!events || events.length === 0)
            return;
        const loadedImages = [];

        events.forEach((event) => {
            if (event.imageUrl) {
                const img = new Image();
                img.src = `http://localhost:8080${event.imageUrl}`;
                loadedImages.push(img);
            }
        });
        preloadedImagesRef.current = loadedImages;
    }, [events]);

    useEffect(() => {
        if (events.length <= 1) {
            return;
        }
        const timer = setTimeout(() => {
            handleNext();
        }, AUTO_SWIPE_NEXT_TIME_INTERVALS);

        return () => clearTimeout(timer);
    }, [currentIndex, events.length]);

    useEffect(() => {
        return () => {
            if (cleanupTimerRef.current) {
                clearTimeout(cleanupTimerRef.current);
            }
        };
    }, []);

    if (isLoading) {
        return <p>Loading events...</p>; //PUT LOADING ANIMATION HEREEE
    } 
    if (error) {
        return <p className="error-message">{error}</p>; //PUT ERROR PAGE HEREEE
    }
    if (events.length === 0) {
        return <p>No events found.</p>;
    }

    const currentEvent = events[currentIndex];
    const previousEvent = previousIndex === null ? null : events[previousIndex];

    // This function receives an event and renders that event to screen
    const renderEventContent = (event, showContent = true) => {
        return(
            <>
                {event.imageUrl && (
                    (<img src={`http://localhost:8080${event.imageUrl}`} /*alt={currentEvent.eventName}*/ className="event-image"/>)
                )}
                <div className="overlay"></div>
                {
                    showContent && (
                        <div className="event-content-div">         
                            <div className="event-text-group">
                                <div className="event-name-div">
                                    <h3 className="event-name">{event.eventName}</h3>
                                </div>
                                <div className="event-description-div">
                                    <p className="event-description">{event.description}</p>
                                </div>
                                <button className="register-button"> Register Now
                                    <div className="icon">
                                        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path></svg>
                                    </div>
                                </button>        
                            </div>
                        </div>
                    )
                }

            </>
        )
    }

    return (
        <main className="events-list">
            <div className="event-carousel">
                <button type="button" onClick={handlePrevious} hidden={events.length <= 1} className="carousel-arrow-left" aria-label="Previous event">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                </button>

                <div className="slider-stack">
                    {previousEvent && //If there is a previous event
                    (
                        <div key={`prev-${previousIndex}`} className={`slider exit-slide ${animationDirection === "right" ? "exit-to-left" : "exit-to-right"}`}>
                            {renderEventContent(previousEvent, false)}
                        </div> 
                    )}

                    <div key={`curr-${currentIndex}`} className={`slider enter-slide ${animationDirection === "right" ? "enter-from-right" : "enter-from-left"}`}>
                        {renderEventContent(currentEvent, true)}
                    </div>
                </div>

                <button type="button" onClick={handleNext} hidden={events.length <= 1} className="carousel-arrow-right" aria-label="Next event">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
                </button>
                <div className="event-progress-outer">
                    <div className="event-progress-wrapper">
                        <div key={`left-${currentIndex}`} className="event-progress-bar-left"></div>
                        <div className="event-counter-bullets">
                            {events.map((_, index) => (
                                <div key={index} className={currentIndex + 1 >= index + 1 ? "bullet-on" : "bullet-off"} onClick={() => setCurrentIndex(index)}></div>
                            ))}
                        </div>
                        <div key={`right-${currentIndex}`} className="event-progress-bar-right"></div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomePage;