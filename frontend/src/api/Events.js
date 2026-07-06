const BASE_URL = "http://localhost:8080/api/events";

//Get
export async function getEvents(){
    const res = await fetch(BASE_URL);
    if(!res.ok) throw new Error("Failed to fetch events");
    return res.json();
}

//Post
export async function createEvent(eventData, imageFile){
   const formData = new FormData();

   formData.append("event", new Blob([JSON.stringify(eventData)],
       {type: "application/json"}));

   if(imageFile){
       formData.append("image", imageFile);
   }

    const res = await fetch(BASE_URL, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Failed to create event");
    return res.json();
}