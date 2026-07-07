import { useEffect, useState } from "react";
import { createEvent } from "../api/Events.js";
import "./create-events.css";
import VSA_blacklogo from "../assets/VSA_blacklogo.png";


function CreateEvents() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [photos, setPhotos] = useState([]);
    const [urls, setURLS] = useState([]);
    const addPhotos = (event) => {
        setPhotos([...photos, ...Array.from(event.target.files)]) //event.target.files is one FileList, without Array.from(), we only add bunch of files as one element.
        photos.forEach(photo => {
            setURLS([...urls, URL.createObjectURL(photo)]);
        });
    }
    
    const removePhotos = (index) => {
        //revoke URLs
        URL.revokeObjectURL(urls[index]);

        const newURLS = [...urls];
        newURLS.splice(index, 1);
        setURLS(newURLS);

        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
    }
    useEffect(() => {
        return () => {
            urls.forEach((photoURL) => {
                URL.revokeObjectURL(photoURL);
            })
        };
    })

    handleEnterKey = (event) => {
        if (event.key ==="Enter") {
            if (event.target.tagName ==="TEXTAREA") {
                return;
            }
            else {
                event.preventDefault();
            }
        }
    }
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
        

        let imageToSend = null;
        const imageFile = formData.get("eventImage");
        console.log("Uploaded image: ", imageFile);

        if (imageFile && imageFile.size > 0) {
            imageToSend = imageFile;
        } 
        else {
            console.log("No image uploaded");
            imageToSend = null;
        }

        const eventData = {
            eventName: formData.get("title"),
            title: formData.get("title"),
            description: formData.get("description"),
            eventDate: formData.get("date"),
            //timezone: formData.get("timezone"),
            startTime: formData.get("startTime"),
            endTime: formData.get("endTime"),
            location: formData.get("location"),
            capacity: Number(formData.get("capacity")),
            minAge: Number(formData.get("minAge")),
            status: formData.get("status"),
        };
 
        try {
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
                    <h1>Create Events</h1>
                    <span>Create a new event and publish it on the website</span>
                </div>
                <img src={VSA_blacklogo} alt="vsa-logo" width="220" height="52"/>
            </div>

            <form className="form-container" id="form-container" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
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
            
                <div className="section" id="time-section">
                    <h3 style={{ gridArea: "timelabel" }}>Time</h3>
                    <div className="box" id="time-box">
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
                        </div>
                    
                        <div className="timeinfo" style={{ gridArea: "start-time" }}>
                            <label>Start Time:</label>
                            <input type="time" name="startTime" id="start-time" required/>
                        </div>

                        <div className="timeinfo" style={{ gridArea: "end-time" }}>
                            <label>End Time:</label>
                            <input type="time" name="endTime" id="end-time" required/>
                        </div>
                    </div>

                </div>
                
                <hr></hr>

                <div className="section" id="location-section">
                    <h3 style={{ gridArea: "locationlabel" }}>Location & other info</h3>
                    <div className="box" id="location-box">
                        <div className="other-info" style={{ gridArea: "location" }} id="location-div">
                            <label>Location</label>
                            <input type="text" name="location" id="location" required/>
                        </div>

                        <div className="other-info" style={{ gridArea: "capacity" }} id="capacity-div">
                            <label>Capacity</label>
                            <input type="number" name="capacity" id="capacity" required/>
                        </div> 

                        <div className="other-info" style={{ gridArea: "min-age" }} id="min-age-div">
                            <label>Min age</label>
                            <input type="number" name="minAge" id="min-age" required/>
                        </div>

                        <div className="other-info" style={{ gridArea: "status" }} id="status-div">
                            <label>Status</label>
                            <select name="status" id="status" required>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="archived">Archived (old)</option>
                            </select>
                        </div>                        
                    </div>
                    
                </div>
                <div id="cover-photo">
                    <h3>Cover Photo</h3>
                    <p>This photo helps desplay the event better on the website homepage</p>
                    <input type="file" name="eventImage" id="eventImage" accept="image/*" multiple hidden onChange={addPhotos}/>
                    <label htmlFor="eventImage" className="upload-button">Upload a photo</label>

                    <div className="photo-preview-list">
                        {
                            urls.map((photoURL, index) => (
                                <div key={index}>
                                    <img src={photoURL} alt={`Preview ${index + 1}`} width="120"/>
                                    <button type="button" onClick={() => removePhotos(index)} className="photo-remove-button">x</button>
                                </div>
                            ))
                        }
                    </div>
                </div>
                
            </form>
            
            <div className="last-button-zone">
                <button type="submit" form="form-container" id="submit-button">Create Event</button>
            </div>
            
        </main>
    );
}



export default CreateEvents;