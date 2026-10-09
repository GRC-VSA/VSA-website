package com.vsa.service;

import com.vsa.controller.AvailabilityDtos.GridResponse;
import com.vsa.controller.AvailabilityDtos.GuestSheetResponse;
import com.vsa.controller.AvailabilityDtos.GuestSubmitRequest;
import com.vsa.controller.AvailabilityDtos.GuestSubmitResponse;
import com.vsa.controller.AvailabilityDtos.GuestUpdateRequest;
import com.vsa.controller.AvailabilityDtos.HeatmapResponse;
import com.vsa.controller.AvailabilityDtos.RecoverLinkRequest;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ForbiddenException;
import com.vsa.exception.InvalidLinkException;
import com.vsa.model.AvailabilityInvite;
import com.vsa.model.AvailabilityParticipant;
import com.vsa.model.AvailabilitySheet;
import com.vsa.repository.AvailabilityInviteRepository;
import com.vsa.repository.AvailabilityParticipantRepository;
import com.vsa.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Guest side of availability sheets: everything reached through an invite link, no login.
 *
 * <p>Guests see the anonymous heatmap and the responder count, never names or notes. A guest's
 * entry is theirs to edit only with the edit token returned when they first submit (or a new one
 * emailed through {@link #recoverLink}).
 *
 * @author VSA Development Team
 */
@Service
@Transactional
public class AvailabilityGuestService {

    static final String INVALID_LINK = "This availability link is invalid or has expired";
    static final String INVALID_EDIT_TOKEN =
            "Your edit link is no longer valid. Request a new one with your email.";

    private final AvailabilityInviteRepository inviteRepository;
    private final AvailabilityParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final AvailabilityHeatmapBuilder heatmapBuilder;
    private final EmailOutboxService emailOutboxService;

    public AvailabilityGuestService(
            AvailabilityInviteRepository inviteRepository,
            AvailabilityParticipantRepository participantRepository,
            UserRepository userRepository,
            AvailabilityHeatmapBuilder heatmapBuilder,
            EmailOutboxService emailOutboxService) {
        this.inviteRepository = inviteRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.heatmapBuilder = heatmapBuilder;
        this.emailOutboxService = emailOutboxService;
    }

    /**
     * The sheet as seen through an invite link. If a valid edit token is sent, the guest's own entry
     * is included; an invalid one is ignored (myEntry comes back null, so the frontend can drop it).
     */
    public GuestSheetResponse view(String inviteToken, String editToken) {
        AvailabilityInvite invite = requireActiveInvite(inviteToken);
        AvailabilityParticipant mine = findByEditToken(invite, editToken).orElse(null);
        return buildView(invite, mine);
    }

    /** First submission. Returns the raw edit token once; only its hash is stored. */
    public GuestSubmitResponse submit(String inviteToken, GuestSubmitRequest request) {
        AvailabilityInvite invite = requireActiveInvite(inviteToken);
        AvailabilitySheet sheet = invite.getSheet();
        AvailabilityService.requireOpen(sheet);
        if (!invite.hasUsesLeft()) {
            throw new ConflictException("This link has reached its response limit");
        }

        String email = normalizeEmail(request.email());
        boolean isOfficer =
                userRepository
                        .findByEmailIgnoreCase(email)
                        .map(user -> user.getRole() == null ? "" : user.getRole().toLowerCase(Locale.ROOT))
                        .filter(AvailabilityService.OFFICER_ROLES::contains)
                        .isPresent();
        if (isOfficer) {
            throw new ConflictException(
                    "This email belongs to a VSA officer account."
                            + " Log in and fill in the sheet from the officer page instead.");
        }
        if (participantRepository
                .findBySheet_SheetIdAndGuestEmailIgnoreCase(sheet.getSheetId(), email)
                .isPresent()) {
            throw new ConflictException(
                    "This email already has a response on this sheet."
                            + " Use your edit link, or request a new one.");
        }
        AvailabilityGrid.validateSlots(sheet, request.slots());

        String editToken = AvailabilityTokens.newToken();
        AvailabilityParticipant entry = new AvailabilityParticipant();
        entry.setSheet(sheet);
        entry.setInvite(invite);
        entry.setGuestName(request.name().trim());
        entry.setGuestEmail(email);
        entry.setEditTokenHash(AvailabilityTokens.sha256Hex(editToken));
        // Guests are labelled by the link they came through, e.g. "ISA collaborator".
        entry.setRoleLabel(invite.getLabel());
        entry.setNote(AvailabilityMapper.trimToNull(request.note()));
        AvailabilityGrid.applySlots(entry, request.slots());
        invite.setUseCount(invite.getUseCount() + 1);

        participantRepository.saveAndFlush(entry);
        return new GuestSubmitResponse(editToken, buildView(invite, entry));
    }

    /** Replaces the guest's selection, name and note. Their email can't change. */
    public GuestSheetResponse update(
            String inviteToken, String editToken, GuestUpdateRequest request) {
        AvailabilityInvite invite = requireActiveInvite(inviteToken);
        AvailabilitySheet sheet = invite.getSheet();
        AvailabilityService.requireOpen(sheet);
        AvailabilityParticipant entry = requireByEditToken(invite, editToken);
        AvailabilityGrid.validateSlots(sheet, request.slots());

        entry.setGuestName(request.name().trim());
        entry.setNote(AvailabilityMapper.trimToNull(request.note()));
        entry.setUpdatedAt(LocalDateTime.now());
        AvailabilityGrid.applySlots(entry, request.slots());

        participantRepository.saveAndFlush(entry);
        return buildView(invite, entry);
    }

    public void withdraw(String inviteToken, String editToken) {
        AvailabilityInvite invite = requireActiveInvite(inviteToken);
        AvailabilityService.requireOpen(invite.getSheet());
        participantRepository.delete(requireByEditToken(invite, editToken));
    }

    /**
     * Emails a fresh edit link if this email has an entry on the sheet, and replaces the old token.
     * Does the same visible thing either way, so the endpoint can't be used to check who responded.
     */
    public void recoverLink(String inviteToken, RecoverLinkRequest request) {
        AvailabilityInvite invite = requireActiveInvite(inviteToken);
        AvailabilitySheet sheet = invite.getSheet();
        String email = normalizeEmail(request.email());

        participantRepository
                .findBySheet_SheetIdAndGuestEmailIgnoreCase(sheet.getSheetId(), email)
                .ifPresent(
                        entry -> {
                            String editToken = AvailabilityTokens.newToken();
                            entry.setEditTokenHash(AvailabilityTokens.sha256Hex(editToken));
                            emailOutboxService.queueAvailabilityEditLinkEmail(
                                    entry.getGuestEmail(),
                                    entry.getGuestName(),
                                    sheet.getTitle(),
                                    editPath(inviteToken, editToken));
                        });
    }

    /** Frontend route the email links to. Keep in sync with the React router. */
    static String editPath(String inviteToken, String editToken) {
        return "/availability/invite/" + inviteToken + "?edit=" + editToken;
    }

    // ── Helpers ────────────────────────────────────────────────

    private GuestSheetResponse buildView(AvailabilityInvite invite, AvailabilityParticipant mine) {
        AvailabilitySheet sheet = invite.getSheet();
        GridResponse grid = AvailabilityGrid.build(sheet);
        long responders = participantRepository.countBySheet_SheetId(sheet.getSheetId());
        HeatmapResponse heatmap = heatmapBuilder.build(sheet, grid, responders);
        return new GuestSheetResponse(
                AvailabilityMapper.sheetInfo(sheet, Instant.now()),
                grid,
                heatmap,
                invite.getLabel(),
                mine == null ? null : AvailabilityMapper.guestEntry(mine));
    }

    private AvailabilityInvite requireActiveInvite(String inviteToken) {
        if (inviteToken == null || inviteToken.isBlank()) {
            throw new InvalidLinkException(INVALID_LINK);
        }
        return inviteRepository
                .findByToken(inviteToken)
                .filter(invite -> invite.isActiveAt(Instant.now()))
                .orElseThrow(() -> new InvalidLinkException(INVALID_LINK));
    }

    private Optional<AvailabilityParticipant> findByEditToken(
            AvailabilityInvite invite, String editToken) {
        if (editToken == null || editToken.isBlank()) {
            return Optional.empty();
        }
        return participantRepository.findBySheet_SheetIdAndEditTokenHash(
                invite.getSheet().getSheetId(), AvailabilityTokens.sha256Hex(editToken.trim()));
    }

    private AvailabilityParticipant requireByEditToken(AvailabilityInvite invite, String editToken) {
        return findByEditToken(invite, editToken)
                .orElseThrow(() -> new ForbiddenException(INVALID_EDIT_TOKEN));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
