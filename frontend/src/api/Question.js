import { API_BASE_URL } from "./config"
import { getTokenforAuthHeader } from "./authHeaders";
const QUESTION_TYPES_URL = `${API_BASE_URL}/api/question-types`

// GET question-type
export async function getQuestionTypes() {
    const res = await fetch(QUESTION_TYPES_URL);
    if (!res.ok)
        throw new Error("Failed to fetch question type at Question.js");
    return res.json();
}

// POST questions
export async function createQuestions(eventId, questions) {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/questions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getTokenforAuthHeader()
        },
        body: JSON.stringify(questions)
    });
    if (!res.ok)
        throw new Error("Faild to create questions for event");

    return res.json();
}