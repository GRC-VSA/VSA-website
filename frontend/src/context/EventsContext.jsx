/**************************************************************************************************************************
Brief:
- This file creates and stores the context for events.
- It allows other pages to access 
- Fetch once, share data together
P/S: A context is all the data fetched from the backend via certain API.

Explain:
1. Fetch events data from the backend once using "getEvents"  (the helper method is defined in: "../api/Events.js"),
2. Store the event data into "EventsContext"  
3. Share the data with other pages that also need events info via "useEvents()"

****************************************************************************************************************************/

import { createContext, useContext, useState, useEffect } from "react";
import { getEvents } from "../api/Events.js";

//Create a new empty context and stores it in "EventsContext"
const EventsContext = createContext(null);

export const EventsProvider = ( {children} ) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                const data = await getEvents();
                setEvents(data);
                setError(null);
            }
            catch (err) {
                console.error("Failed to fetch events", err);
                setError("Could not load events");
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <EventsContext.Provider value={{events, isLoading, error}}>
            {children}
        </EventsContext.Provider>
    );
};

export const useEvents = () => {
    return useContext(EventsContext);
}

// export default useEvents;