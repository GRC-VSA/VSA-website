const BASE_URL = "http://localhost:8080/api/events";

//Get
export async function getEvents(){
    const res = await fetch(BASE_URL);
    if(!res.ok) throw new Error("Failed to fetch events");
    return res.json();
}

//Post
export async function createEvent(eventData){
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify(eventData),
    });
    if(!res.ok) throw new Error("Failed to create event");
    return res.json();
}