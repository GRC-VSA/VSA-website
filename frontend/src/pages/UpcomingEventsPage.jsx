import { useEvents } from "../context/EventsContext.jsx";
import "./UpcomingEventsPage.css";
const UpcomingEventsPage = () => {
    const { events, isLoading, error } = useEvents();

    const upcomingEvents = events.filter((event) => event.status === "upcoming");
    const ongoingEvents = events.filter((event) => event.status ==="ongoing");

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <main>
            <div className="container">
                <h1>Upcoming Events</h1>
                {upcomingEvents.map((event) => (
                    <div key={event.eventId} className="event-detail-card">
                        <h3>{event.eventName}</h3>
                        <p>{event.description}</p>
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