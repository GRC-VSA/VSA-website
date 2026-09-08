package com.vsa.dto.request;

import java.util.List;

import com.vsa.dto.request.AnswerRequest;
import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for submitting an event registration.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
public class RegistrationRequest {
    /** Optional; defaults to "general" if omitted */
    private String ticketType;

    /** Answers to the event's custom questions, submitted alongside the registration */
    private List<AnswerRequest> answers;
}