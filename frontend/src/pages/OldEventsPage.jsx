import { useEvents } from "../context/EventsContext.jsx";

const OldEventsPage = () => {
    const { events, isLoading, error } = useEvents();

    const oldEvents = events.filter((event) => event.status === "archived");

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <main>
            <div className="container">
                <h1>Old Events</h1>
                {oldEvents.map((event) => (
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

export default OldEventsPage;