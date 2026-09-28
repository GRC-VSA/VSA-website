package com.vsa.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.vsa.dto.request.OurTeamRequest;
import com.vsa.dto.response.OurTeamResponse;
import com.vsa.model.OurTeam;
import com.vsa.repository.OurTeamRepository;

@Service
public class OurTeamService {

    private final OurTeamRepository ourTeamRepository;
    private final FileStorageService fileStorageService;

    private static final Map<String, Integer> POSITION_ORDER = Map.of(
            "President", 1,
            "Vice President", 2,
            "Head of Event Organizer", 3,
            "Marketing Strategist", 4,
            "Performing Art Director", 5,
            "Event Organizer", 6,
            "Social Media Manager", 7
    );

    public OurTeamService(
            OurTeamRepository ourTeamRepository,
            FileStorageService fileStorageService
    ) {
        this.ourTeamRepository = ourTeamRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<OurTeamResponse> getAllOfficers() {

        List<OurTeam> officers
                = ourTeamRepository.findAllByOrderByGenerationDescOfficerNameAsc();

        return officers.stream()
                .sorted(
                        Comparator
                                .comparing(
                                        OurTeam::getGeneration,
                                        Comparator.reverseOrder()
                                )
                                .thenComparingInt(
                                        officer
                                        -> POSITION_ORDER.getOrDefault(
                                                officer.getOfficerPosition(),
                                                Integer.MAX_VALUE
                                        )
                                )
                                .thenComparing(
                                        OurTeam::getOfficerName,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                )
                .map(this::toResponse)
                .toList();
    }

    public List<OurTeamResponse> getOfficersByGeneration(Integer generation) {

        List<OurTeam> officers
                = ourTeamRepository.findByGenerationOrderByOfficerNameAsc(generation);

        return sortOfficers(officers)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OurTeamResponse createOfficer(
            OurTeamRequest request,
            MultipartFile image
    ) {

        validateImage(image);

        String imageUrl = null;

        try {
            imageUrl = fileStorageService.save(image);

            OurTeam officer = new OurTeam();

            officer.setGeneration(request.getGeneration());
            officer.setOfficerName(request.getOfficerName());
            officer.setOfficerPosition(request.getOfficerPosition());
            officer.setOfficerImage(imageUrl);
            officer.setOfficerQuote(request.getOfficerQuote());
            officer.setOfficerInstagramUrl(request.getOfficerInstagramUrl());
            officer.setOfficerLinkedinUrl(request.getOfficerLinkedinUrl());
            officer.setOfficerEmail(request.getOfficerEmail());

            OurTeam savedOfficer = ourTeamRepository.save(officer);

            return toResponse(savedOfficer);

        } catch (RuntimeException e) {

            if (imageUrl != null) {
                try {
                    fileStorageService.deleteFile(imageUrl);
                } catch (RuntimeException cleanupException) {
                    e.addSuppressed(cleanupException);
                }
            }

            throw e;
        }
    }

    @Transactional
    public void deleteOfficer(Long ourTeamId) {

        OurTeam officer = ourTeamRepository.findById(ourTeamId)
                .orElseThrow(()
                        -> new IllegalArgumentException(
                        "Officer not found with ID: " + ourTeamId
                )
                );

        fileStorageService.deleteFile(officer.getOfficerImage());

        ourTeamRepository.delete(officer);
    }

    private void validateImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException(
                    "Officer image is required."
            );
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException(
                    "Uploaded file must be an image."
            );
        }
    }

    private List<OurTeam> sortOfficers(List<OurTeam> officers) {

        return officers.stream()
                .sorted(
                        Comparator
                                .comparingInt(
                                        (OurTeam officer)
                                        -> POSITION_ORDER.getOrDefault(
                                                officer.getOfficerPosition(),
                                                Integer.MAX_VALUE
                                        )
                                )
                                .thenComparing(
                                        OurTeam::getOfficerName,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                )
                .toList();
    }

    private OurTeamResponse toResponse(OurTeam officer) {

        OurTeamResponse response = new OurTeamResponse();

        response.setOurTeamId(officer.getOurTeamId());
        response.setGeneration(officer.getGeneration());
        response.setOfficerName(officer.getOfficerName());
        response.setOfficerPosition(officer.getOfficerPosition());
        response.setOfficerImage(officer.getOfficerImage());
        response.setOfficerQuote(officer.getOfficerQuote());
        response.setOfficerInstagramUrl(officer.getOfficerInstagramUrl());
        response.setOfficerLinkedinUrl(officer.getOfficerLinkedinUrl());
        response.setOfficerEmail(officer.getOfficerEmail());

        return response;
    }
}
