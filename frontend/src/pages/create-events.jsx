import { useState } from "react";
import { createEvent } from "../api/Events";
import "./create-events.css";
import blackhorizontallockup from "../assets/black-horizontal-lockup.png";


function CreateEvents() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.target);


        // Below chunk of code is to debug frontend sending form behavior

        console.log("Event Title: ", formData.get("title"));
        console.log("Description: ", formData.get("description"));
        console.log("Date: ", formData.get("date"));
        console.log("Timezone: ", formData.get("timezone"));
        console.log("Start Time: ", formData.get("startTime"));
        console.log("End Time: ", formData.get("endTime"));
        console.log("Location: ", formData.get("location"));
        console.log("Capacity: ", Number(formData.get("capacity")));
        console.log("Minimum Age: ", Number(formData.get("minAge")));
        console.log("Status: ", formData.get("status"));
        console.log("Uploaded image: ", formData.get("eventImage"));
        //Stop debugging here

        let imageToSend = null;
        const imageFile = formData.get("eventImage");
        
        

        
        if (imageFile && imageFile.size > 0) {
            console.log("Uploaded image: ", imageFile);
            console.log("Image name: ", imageFile.name);
            console.log("Image type: ", imageFile.type); 
            console.log("Image size: ", imageFile.size);
        } 
        else {
            console.log("No image uploaded");
            imageToSend = null;
        }

        const eventData = {
            title: formData.get("title"),
            description: formData.get("description"),
            date: formData.get("date"),
            timezone: formData.get("timezone"),
            startTime: formData.get("startTime"),
            endTime: formData.get("endTime"),
            location: formData.get("location"),
            capacity: Number(formData.get("capacity")),
            minAge: Number(formData.get("minAge")),
            status: formData.get("status"),
        };
 

        try {
            setIsSubmitting(true);

            const createdEvent = await createEvent(eventData, imageToSend);
            
            console.log("Backend response: ", createdEvent);
            console.log("Event created successfully.");

            event.target.reset();
        } 
        catch (error) {
            console.error("Failed to create event: ", error);
        } 
        finally {
            setIsSubmitting(false);
        }
    }
    return (
        <main className="create-events">
            <div id="header">
                <div id="page-name">
                    <h2>Create Events</h2>
                    <span>Create a new event and publish it on the website</span>
                </div>
                <img src={blackhorizontallockup} alt="vsa-logo" width="200"/>
            </div>

            <form className="form-container" id="form-container" onSubmit={handleSubmit}>
                <div id="title-section">
                    <h3>Title</h3>
                    <div className="event-title-desc">
                        <label>Event Name:</label>
                        <input type="text" name="title" id="title" placeholder="Name of the event" required/>
                    </div>

                    <div className="event-title-desc">
                        <label>Event Description:</label>
                        <textarea name="description" id="description" placeholder="Describe the event here." required></textarea>
                    </div>
                </div>

                <hr></hr>
            
                <div id="time-section">
                    <h3 style={{ gridArea: "timelabel" }}>Time</h3>
                    <div className="timeinfo" style={{ gridArea: "timezone" }}>
                        <label>Timezone:</label>
                        <select name="timezone" id="timezone" required>
                           <option value="Seattle">Seattle</option>
                           <option value="Chicago">Chicago</option>
                           <option value="Vietnam">Vietnam</option>
                        </select>
                    </div>
                    <div className="timeinfo" style={{ gridArea: "date" }}>
                        <label>Date:</label>
                        <input type="date" name="date" id="date" required/>
                        <img></img>
                    </div>
                    
                    <div className="timeinfo" style={{ gridArea: "start-time" }}>
                        <label>Start Time:</label>
                        <input type="time" name="startTime" id="start-time" required/>
                        <img></img>
                    </div>

                    <div className="timeinfo" style={{ gridArea: "end-time" }}>
                        <label>End Time:</label>
                        <input type="time" name="endTime" id="end-time" required/>
                        <img></img>
                    </div>
                </div>
                
                <hr></hr>

                <div id="location-section">
                    <h3 style={{ gridArea: "locationlabel" }}>Location & other info</h3>
                    <div className="other-info" style={{ gridArea: "location" }}>
                        <label>Location</label>
                        <input type="text" name="location" id="location" required/>
                    </div>

                    <div className="other-info" style={{ gridArea: "capacity" }}>
                        <label>Capacity</label>
                        <input type="number" name="capacity" id="capacity" required/>
                    </div> 

                    <div className="other-info" style={{ gridArea: "min-age" }}>
                        <label>Min age</label>
                        <input type="number" name="minAge" id="min-age" required/>
                    </div>

                    <div className="other-info" style={{ gridArea: "status" }}>
                        <label>Status</label>
                        <select name="status" id="status" required>
                            <option value="Upcoming">Upcoming</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Archived">Old-archived</option>
                        </select>
                    </div>
                </div>
                <div id="cover-photo">
                    <h3>Cover Photo</h3>
                    <span>This photo helps desplay the event better on the website homepage</span>
                    <input type="file" name="eventImage" accept="image/*"/>
                </div>
                


                
            </form>
            
            <div className="last-button-zone">
                <button type="submit" form="form-container" id="submit-button">Create Event</button>
            </div>
            
        </main>
    );
}

export default CreateEvents;