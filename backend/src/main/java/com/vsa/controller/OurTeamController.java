package com.vsa.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vsa.dto.request.OurTeamRequest;
import com.vsa.dto.response.OurTeamResponse;
import com.vsa.service.OurTeamService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/our-team")
public class OurTeamController {

    private final OurTeamService ourTeamService;

    public OurTeamController(OurTeamService ourTeamService) {
        this.ourTeamService = ourTeamService;
    }

    // GET /api/our-team
    // vd: GET /api/our-team?generation=5
    @GetMapping
    public ResponseEntity<List<OurTeamResponse>> getOfficers(
            @RequestParam(required = false) Integer generation
    ) {

        if (generation != null) {
            return ResponseEntity.ok(
                    ourTeamService.getOfficersByGeneration(generation)
            );
        }

        return ResponseEntity.ok(
                ourTeamService.getAllOfficers()
        );
    }

    // POST /api/our-team
    @PostMapping
    public ResponseEntity<OurTeamResponse> createOfficer(
            @Valid @RequestPart("officer") OurTeamRequest officer,
            @RequestPart("image") MultipartFile image
    ) {

        OurTeamResponse createdOfficer =
                ourTeamService.createOfficer(officer, image);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdOfficer);
    }

    // DELETE /api/our-team/{ourTeamId}
    @DeleteMapping("/{ourTeamId}")
    public ResponseEntity<Void> deleteOfficer(
            @PathVariable Long ourTeamId
    ) {

        ourTeamService.deleteOfficer(ourTeamId);

        return ResponseEntity.noContent().build();
    }
}