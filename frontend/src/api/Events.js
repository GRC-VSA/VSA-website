import { API_BASE_URL } from "./config.js";
import { getTokenforAuthHeader } from "./authHeaders.js";

const BASE_URL = `${API_BASE_URL}/api/events`;

//Get
export async function getEvents(){
    const res = await fetch(BASE_URL);
    if(!res.ok) throw new Error("Failed to fetch events");
    return res.json();
}

//Post
export async function createEvent(eventData, imageFiles = []){
   const formData = new FormData();

   formData.append("event", new Blob([JSON.stringify(eventData)],
       {type: "application/json"}));

   if(imageFiles.length > 0){
        imageFiles.forEach((image) => {
            formData.append("image", image);
        });
   }

    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            ...getTokenforAuthHeader()
        },
        body: formData,
    });

    if (!res.ok) throw new Error("Failed to create event");
    return res.json();
}