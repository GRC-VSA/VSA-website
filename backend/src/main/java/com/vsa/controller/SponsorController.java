package com.vsa.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vsa.dto.request.SponsorRequest;
import com.vsa.dto.response.SponsorResponse;
import com.vsa.service.SponsorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sponsors")
public class SponsorController {

    private final SponsorService sponsorService;

    public SponsorController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }


    @GetMapping
    public ResponseEntity<List<SponsorResponse>> getAllSponsors() {

        List<SponsorResponse> sponsors = sponsorService.getAllSponsors();
        return ResponseEntity.ok(sponsors);
    }


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SponsorResponse> createSponsor(
            @Valid
            @RequestPart("sponsor")
            SponsorRequest sponsorRequest,

            @RequestPart("image")
            MultipartFile image
    ) {
        SponsorResponse createdSponsor = sponsorService.createSponsor(sponsorRequest, image);
        return ResponseEntity.ok(createdSponsor);
    }


    @DeleteMapping("/{sponsorId}")
    public ResponseEntity<Void> deleteSponsor(@PathVariable Integer sponsorId) {

        sponsorService.deleteSponsor(sponsorId);
        return ResponseEntity.noContent().build();
    }
}