import { useEvents } from "../context/EventsContext.jsx";
import "./UpcomingEventsPage.css";

import coverPhoto from "../assets/guest/upcomingeventcover.jpg"
const UpcomingEventsPage = () => {
    const { events, isLoading, error } = useEvents();

    const upcomingEvents = events.filter((event) => event.status === "upcoming");
    const ongoingEvents = events.filter((event) => event.status === "ongoing");

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
            month = new Date(eventDate).toLocaleString('en-US', { month: 'long', timezone: 'UTC' })
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
            else  {
                return location.slice(0, 24);
            }
        }
        else {
            return location;
        }
    }
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <main id="upcoming-event-main">
            <div id="cover-photo-container">
                <img src={coverPhoto} id="cover-photo"></img>
                <div id="overlay"></div>
                <div className="cover-photo-text">
                    <h1>Upcoming Events</h1>
                    <span>Immerse in fun and exploration at our events</span>
                </div>
            </div>
            <div className="container">
                {/* <h1>Upcoming Events</h1> */}
                {upcomingEvents.map((event) => (
                    <div key={event.eventId} className="event-card">
                        <div className="image-placeholder">
                            <img src={`http://localhost:8080${event.imageUrl}`} />
                            <div className="event-date">
                                <span>{new Date(event.eventDate).toLocaleDateString('en-US', { day: 'numeric', timezone: 'UTC' })}</span>
                                <span>{displayEventMonth(event.eventDate)}</span>
                            </div>
                        </div>
                        <div className="event-detail-placeholder">
                            <div className="event-main-info-div">
                                <h3>{event.eventName}</h3>
                                {/* <div className="price-div">
                                    <span>Free</span>
                                </div> */}
                            </div>
                            <p className="event-description">{event.description}</p>

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

                        {/* PUT MORE STUFF HEREEE */}
                    </div>
                ))}
            </div>

            <div className="container">
                <h1>Ongoing Events</h1>
                {ongoingEvents.map((event) => (
                    <div key={event.eventId} className="event-detail-card">
                        <h3>{event.eventName}</h3>
                        <p>{event.description}</p>
                        {/* PUT MORE STUFF HEREEE */}
                    </div>
                ))}
            </div>

        </main>
    );
};

export default UpcomingEventsPage;