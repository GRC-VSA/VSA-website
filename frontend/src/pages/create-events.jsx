import "./create-events.css";

function CreateEvents() {
    function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);

        console.log("Event Title: ", formData.get("title"));
        console.log("Description: ", formData.get("description"));
        console.log("Date: ", formData.get("date"));
        console.log("Start Time: ", formData.get("startTime"));
        console.log("End Time: ", formData.get("endTime"));
        console.log("Location: ", formData.get("location"));
        console.log("Capacity: ", Number(formData.get("capacity")));
        console.log("Minimum Age: ", Number(formData.get("minAge")));
        console.log("Status: ", formData.get("status"));
        console.log("Uploaded image: ", formData.get("eventImage"));
    }
    return (
        <main className="create-events">
            <h1>Create Events</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="Event Title" required/>
                <br/>
                <textarea name="description" placeholder="Describe the event here." required></textarea>
                <br/>
                
                <label htmlFor="date">
                    Date:
                    <br/>
                    <span>Choose a date...</span>
                    <input type="date" name="date" id="date" required/>
                </label>

                <div>
                    <label>
                        Start Time: <br/>
                        <input type="time" name="startTime" required/>
                    </label>
                </div>
                
                <div>
                    <label>
                        End Time: <br/>
                        <input type="time" name="endTime" required/>
                    </label>
                </div>
                
                
                <br/>
                <label>
                    Location: <br/>
                    <input type="text" name="location" placeholder="Where is the event hosted?" required/>
                </label>
                
                <br/>
                <label>
                    Capacity: <br/>
                    <input type="number" name="capacity" placeholder="Maximum guests" min="1" required/>
                </label>
                <br/>
                <label>
                    Min age:
                    <select name="minAge" required>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                        <option value="13">13</option>
                        <option value="14">14</option>
                        <option value="15">15</option>
                        <option value="16">16</option>
                        <option value="17">17</option>
                        <option value="18">18</option>
                        <option value="19">19</option>
                        <option value="20">20</option>
                        <option value="21">21</option>
                    </select>
                </label>
                
                <label>Status
                    <select name="status" required>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="archived">Old (archived) </option>
                    </select>
                </label>

                <br/>

                <label>
                    Event image/flyer:
                    <input type="file" name="eventImage" accept="image/*"/>
                </label>
                <br/>
                <button type="submit">Create Event</button>
            </form>
        </main>
    );
}

export default CreateEvents;