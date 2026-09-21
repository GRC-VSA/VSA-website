
package com.vsa.dto.response;

/**
 * This file is for the Page Applicants in the Officer side
 */
public record ApplicationOverviewResponse(

    long totalApplicants,

    long averageApplicationSeconds

) {}