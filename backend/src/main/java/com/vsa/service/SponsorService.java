package com.vsa.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.vsa.dto.request.SponsorRequest;
import com.vsa.dto.response.SponsorResponse;
import com.vsa.model.Sponsor;
import com.vsa.repository.SponsorRepository;

@Service
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final FileStorageService fileStorageService;

    public SponsorService(
            SponsorRepository sponsorRepository,
            FileStorageService fileStorageService
    ) {
        this.sponsorRepository = sponsorRepository;
        this.fileStorageService = fileStorageService;
    }


    public List<SponsorResponse> getAllSponsors() {

        List<Sponsor> sponsors = sponsorRepository.findAllByOrderBySponsorIdAsc();

        return sponsors.stream()
                .map(this::toResponse)
                .toList();
    }


    @Transactional
    public SponsorResponse createSponsor(
            SponsorRequest request,
            MultipartFile image
    ) {

        validateImage(image);

        String logoUrl = null;

        try {

            logoUrl = fileStorageService.save(image);

            Sponsor sponsor = new Sponsor();

            sponsor.setName(request.getName());
            sponsor.setLogoUrl(logoUrl);
            sponsor.setWebsiteUrl(request.getWebsiteUrl());
            sponsor.setDescription(request.getDescription());
            sponsor.setYear(request.getYear());

            Sponsor savedSponsor = sponsorRepository.save(sponsor);

            return toResponse(savedSponsor);

        } catch (RuntimeException e) {

            /*
             * If the image was successfully uploaded to S3,
             * but saving the Sponsor into PostgreSQL failed,
             * remove the uploaded image so we do not leave
             * an unused file in S3.
             */
            if (logoUrl != null) {

                try {
                    fileStorageService.deleteFile(logoUrl);
                }
                catch (RuntimeException cleanupException) {
                    e.addSuppressed(cleanupException);
                }
            }

            throw e;
        }
    }


    @Transactional
    public void deleteSponsor(Integer sponsorId) {

        Sponsor sponsor = sponsorRepository
                .findById(sponsorId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Sponsor not found with ID: "
                                        + sponsorId
                        )
                );

        /*
         * Delete the logo from S3 first.
         * logoUrl contains the CloudFront URL stored
         * in the database.
         */
        fileStorageService.deleteFile(sponsor.getLogoUrl());

        sponsorRepository.delete(sponsor);
    }


    private void validateImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException(
                    "Sponsor logo is required."
            );
        }

        String contentType = image.getContentType();

        if (
                contentType == null ||
                !contentType.startsWith("image/")
        ) {
            throw new IllegalArgumentException(
                    "Uploaded sponsor logo must be an image."
            );
        }
    }


    private SponsorResponse toResponse(Sponsor sponsor) {

        SponsorResponse response = new SponsorResponse();

        response.setSponsorId(sponsor.getSponsorId());

        response.setName(sponsor.getName());

        response.setLogoUrl(sponsor.getLogoUrl());

        response.setWebsiteUrl(sponsor.getWebsiteUrl());

        response.setDescription(sponsor.getDescription());

        response.setYear(sponsor.getYear());

        return response;
    }
}