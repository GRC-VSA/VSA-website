import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../api/Events.js";
import "./CreateEventPage.css";
import VSA_blacklogo from "../assets/officer/VSA_blacklogo.png"


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
        status: 'upcoming',
        registrationType: 'NONE',
        externalRegistrationUrl: ''
    });

    const navigate = useNavigate();
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
        const handleChange = (event) => {
            const { name, value } = event.target;
            setFormData({
                ...formData, [name]: value,
                ...(name === "registrationType" && value !== "EXTERNAL" ? { externalRegistrationUrl: "" } : {})
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

        event.target.value = '';
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
        if (event.key === "Enter") {
            if (event.target.tagName === "TEXTAREA") {
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
            const eventData = {
                ...formData,
                externalRegistrationUrl: formData.registrationType === "EXTERNAL" ? formData.externalRegistrationUrl : null
            };

            const createdEvent = await createEvent(eventData, imageFiles);
            const createdEventID = createdEvent.eventId;
            console.log("Backend response: ", createdEvent);
            console.log("Event created successfully.");

            if (formData.registrationType === "INTERNAL") {
                navigate(`/officer/events/${createdEventID}/create-registration-form`);
                return;
            }
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
                status: 'upcoming',
                registrationType: 'NONE',
                externalRegistrationUrl: ''
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
                <img src={VSA_blacklogo} alt="vsa-logo" />
            </div>

            <form className="form-container" id="form-container" onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
                <div id="title-section">
                    <h3>Title</h3>
                    <div className="event-title-desc">
                        <label>Event Name:</label>
                        <input type="text" name="eventName" value={formData.eventName} id="title" placeholder="Name of the event" onChange={handleChange} required />
                    </div>

                    <div className="event-title-desc">
                        <label>Event Category:</label>
                        <input type="text" name="title" value={formData.title} placeholder="Cate of the event" onChange={handleChange} required />
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
                            <input type="date" name="eventDate" value={formData.eventDate} id="date" onChange={handleChange} required />
                        </div>

                        <div className="timeinfo" style={{ gridArea: "start-time" }}>
                            <label>Start Time:</label>
                            <input type="time" name="startTime" value={formData.startTime} id="start-time" onChange={handleChange} required />
                        </div>

                        <div className="timeinfo" style={{ gridArea: "end-time" }}>
                            <label>End Time:</label>
                            <input type="time" name="endTime" value={formData.endTime} id="end-time" onChange={handleChange} required />
                        </div>
                    </div>
                </div>

                <hr></hr>

                <div className="section" id="location-section">
                    <h3 style={{ gridArea: "locationlabel" }}>Location & other info</h3>
                    <div className="box" id="location-box">
                        <div className="other-info" style={{ gridArea: "location" }} id="location-div">
                            <label>Location</label>
                            <input type="text" name="location" value={formData.location} id="location" onChange={handleChange} required />
                        </div>

                        <div className="other-info" style={{ gridArea: "capacity" }} id="capacity-div">
                            <label>Capacity</label>
                            <input type="number" name="capacity" value={formData.capacity} id="capacity" onChange={handleChange} required />
                        </div>

                        <div className="other-info" style={{ gridArea: "min-age" }} id="min-age-div">
                            <label>Min age</label>
                            <input type="number" name="minAge" value={formData.minAge} id="min-age" onChange={handleChange} required />
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

                <hr></hr>

                <div id="registration_div">
                    <h3>Registration</h3>
                    <div id="registration_type_div">
                        <label htmlFor="registrationType">Where do students register for this event?</label>
                        <select name="registrationType" value={formData.registrationType} onChange={handleChange} required>
                            <option value="NONE">No Registration Needed</option>
                            <option value="INTERNAL">On this VSA Website</option>
                            <option value="EXTERNAL">Through an external link</option>
                        </select>
                    </div>

                    {formData.registrationType === "EXTERNAL" && (
                        <div id="external_url_div">
                            <label htmlFor="externalRegistrationUrl">External URL for students to register</label>
                            <input
                                id="external_url"
                                name="externalRegistrationUrl"
                                type="url"
                                value={formData.externalRegistrationUrl}
                                placeholder="https://example.com/ticketseller"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                </div>

                <hr></hr>

                <div id="cover-photo">
                    <h3>Cover Photo</h3>
                    <p>This photo helps desplay the event better on the website homepage</p>
                    <input type="file" name="eventImage" id="eventImage" accept="image/*" onChange={handleImageChange} multiple hidden />
                    <label htmlFor="eventImage" className="upload-button">Upload a photo</label>

                    <div className="photo-preview-list">
                        {
                            imagePreviews.length > 0 && imagePreviews.map((url, index) => (
                                <div key={url}>
                                    <img src={url} alt={`Preview ${index + 1}`} width="100px" />
                                    <button type="button" onClick={() => handleRemoveImage(index)}>x</button>
                                </div>
                            ))
                        }
                    </div>
                </div>


            </form>

            <div className="last-button-zone">
                {
                    formData.registrationType === "INTERNAL" ? (
                        <button type="submit" form="form-container" id="submit-button">
                            Continue to Create Registration Form
                        </button>
                    )
                        : (
                            <button type="submit" form="form-container" id="submit-button">Create This Event</button>
                        )
                }
            </div>

        </main>
    );
}

export default CreateEventPage;