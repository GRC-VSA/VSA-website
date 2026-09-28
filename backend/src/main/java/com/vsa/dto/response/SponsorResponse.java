package com.vsa.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SponsorResponse {

    private Integer sponsorId;
    private String name;
    private String logoUrl;
    private String websiteUrl;
    private String description;
    private Integer year;
}