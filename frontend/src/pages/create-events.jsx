import { useEffect, useState } from "react";
import { createEvent } from "../api/Events.js";
import "./create-events.css";
import VSA_blacklogo from "../assets/VSA_blacklogo.png";


const CreateEventPage = () => {
    const [formData, setFormData] = useState({
        eventName: '',
        title: '', //title is event category right now, fix this later.
        description: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        location: '',
        capacity: '',
        minAge: '',
        status: ''
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleChange = (event) => {
        const {name, value} = event.target;
        setFormData({
            ...formData, [name]: value
        });
    };

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            return;
        }
        setImageFiles((prev) =>  
            [...prev, ...files]
        );

        setImagePreviews((prev) => [
            ...prev, ...files.map((file) => URL.createObjectURL(file))
        ]);

        event.target.value ='';
    };

    const handleRemoveImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);

        const tempImages = [...imageFiles];
        tempImages.splice(index, 1);
        setImageFiles(tempImages);

        const tempPreviews = [...imagePreviews];
        tempPreviews.splice(index, 1);
        setImagePreviews(tempPreviews);
    }

    const handleEnterKey = (event) => {
        if (event.key ==="Enter") {
            if (event.target.tagName ==="TEXTAREA") {
                return;
            }
            else {
                event.preventDefault();
            }
        }
    }

    useEffect(() => {
        return () => {
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);
    
    const handleSubmit = async (event) => {
        event.preventDefault();
    
        try {
            const createdEvent = await createEvent(formData, imageFiles);
        
            console.log("Backend response: ", createdEvent);
            console.log("Event created successfully.");

            setFormData({
                eventName: '',
                title: '',
                description: '',
                eventDate: '',
                startTime: '',
                endTime: '',
                location: '',
                capacity: '',
                minAge: '',
                status: ''
            });
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
            setImageFiles([]);
            setImagePreviews([]);

            alert('Event is created!');
        } 
        catch (error) {
            console.error("Failed to create event: ", error);
            alert('Something went wrong creating event. Please try again.');
        } 

    }
    return (
        <main className="create-events">
            <div id="header">
                <div id="page-name">
                    <h1>Create Events</h1>
                    <span>Create a new event and publish it on the website</span>
                </div>
                <img src={VSA_blacklogo} alt="vsa-logo"/>
            </div>

            <form className="form-container" id="form-container" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
                <div id="title-section">
                    <h3>Title</h3>
                    <div className="event-title-desc">
                        <label>Event Name:</label>
                        <input type="text" name="eventName" value={formData.eventName} id="title" placeholder="Name of the event" onChange={handleChange} required/>
                    </div>

                    <div className="event-title-desc">
                        <label>Event Category:</label>
                        <input type="text" name="title" value={formData.title} placeholder="Cate of the event" onChange={handleChange} required/>
                    </div>

                    <div className="event-title-desc">
                        <label>Event Description:</label>
                        <textarea name="description" value={formData.description} id="description" placeholder="Describe the event here." onChange={handleChange} required ></textarea>
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
                            <input type="date" name="eventDate" value={formData.eventDate} id="date" onChange={handleChange} required/>
                        </div>
                    
                        <div className="timeinfo" style={{ gridArea: "start-time" }}>
                            <label>Start Time:</label>
                            <input type="time" name="startTime" value={formData.startTime} id="start-time" onChange={handleChange} required/>
                        </div>

                        <div className="timeinfo" style={{ gridArea: "end-time" }}>
                            <label>End Time:</label>
                            <input type="time" name="endTime" value={formData.endTime} id="end-time" onChange={handleChange} required/>
                        </div>
                    </div>

                </div>
                
                <hr></hr>

                <div className="section" id="location-section">
                    <h3 style={{ gridArea: "locationlabel" }}>Location & other info</h3>
                    <div className="box" id="location-box">
                        <div className="other-info" style={{ gridArea: "location" }} id="location-div">
                            <label>Location</label>
                            <input type="text" name="location" value={formData.location} id="location" onChange={handleChange} required/>
                        </div>

                        <div className="other-info" style={{ gridArea: "capacity" }} id="capacity-div">
                            <label>Capacity</label>
                            <input type="number" name="capacity" value={formData.capacity} id="capacity" onChange={handleChange} required/>
                        </div> 

                        <div className="other-info" style={{ gridArea: "min-age" }} id="min-age-div">
                            <label>Min age</label>
                            <input type="number" name="minAge" value={formData.minAge} id="min-age" onChange={handleChange} required/>
                        </div>

                        <div className="other-info" style={{ gridArea: "status" }} id="status-div">
                            <label>Status</label>
                            <select name="status" value={formData.status} id="status" onChange={handleChange} required>
                                <option value="" disabled>Select status</option>
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
                    <input type="file" name="eventImage" id="eventImage" accept="image/*" onChange={handleImageChange} multiple hidden/>
                    <label htmlFor="eventImage" className="upload-button">Upload a photo</label>

                    <div className="photo-preview-list">
                        {
                            imagePreviews.length > 0 && imagePreviews.map((url, index) => (
                              <div key={url}> 
                                <img src={url} alt={`Preview ${index + 1}`} width="100px"/>
                                <button type="button" onClick={() => handleRemoveImage(index)}>x</button>
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

export default CreateEventPage;