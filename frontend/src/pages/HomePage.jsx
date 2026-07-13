import { useEffect, useState } from "react";
import { useEvents } from "../context/EventsContext.jsx"
import "./HomePage.css";

const HomePage = () => {

    const { events, isLoading, error } = useEvents();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animationDirection, setAnimationDirection] = useState("right");

    const handlePrevious = () => {
        setAnimationDirection("left");
        setCurrentIndex((prevIndex) => {
            if (prevIndex === 0) {
                prevIndex = events.length - 1;
            }
            else {
                prevIndex -= 1;
            }
            return prevIndex;
        });
    };

    const handleNext = () => {
        setAnimationDirection("right");
        setCurrentIndex((prevIndex) => {
            if (prevIndex === events.length - 1) {
                prevIndex = 0;
            }
            else {
                prevIndex += 1;
            }
            return prevIndex;
        });
    };

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

    return (
        <main className="events-list">
            <div className="event-carousel">
                    <div className="overlay"></div>
                    <button type="button" onClick={handlePrevious} hidden={events.length <= 1} className="carousel-arrow-left" aria-label="Previous event">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                    </button>
                    <div key={currentIndex} className={`slider ${animationDirection === "right" ? "slide-from-right" : "slide-from-left"}`}>
                        {
                            currentEvent.imageUrl && 
                            (<img src={`http://localhost:8080${currentEvent.imageUrl}`} alt={currentEvent.eventName} className="event-image"/>)
                        }
                        <div className="event-content-div">
                            
                            <div className="event-text-group">
                                <div className="event-name-div">
                                    <h3 className="event-name">{currentEvent.eventName}</h3>
                                </div>
                                <div className="event-description-div">
                                    <p className="event-description">{currentEvent.description}</p>
                                </div>

                                <div className="register-button-div">
                                    <button className="register-button">Register Now</button>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/></svg>
                                </div>
                            
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleNext} hidden={events.length <= 1} className="carousel-arrow-right" aria-label="Next event">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
                    </button>
            
                <div className="event-counter-bullets">
                    {events.map((_, index) => (
                        <div key={index} className={currentIndex + 1 >= index + 1 ? "bullet-on" : "bullet-off"} onClick={() => setCurrentIndex(index)}></div>
                    ))}
                </div>
            </div>
            

            {/* <p className="event-counter">
                {currentIndex + 1} / {events.length}
            </p> */}
        </main>
    );
};

export default HomePage;