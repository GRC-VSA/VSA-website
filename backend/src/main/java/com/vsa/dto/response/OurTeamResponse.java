package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OurTeamResponse {

    private Long ourTeamId;

    private Integer generation;

    private String officerName;

    private String officerPosition;

    private String officerImage;

    private String officerQuote;

    private String officerInstagramUrl;

    private String officerLinkedinUrl;

    private String officerEmail;
}