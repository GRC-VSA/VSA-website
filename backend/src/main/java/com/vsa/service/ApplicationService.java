package com.vsa.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vsa.dto.request.ApplicationAnswerRequest;
import com.vsa.dto.request.SaveApplicationBuilderRequest;
import com.vsa.dto.request.SaveApplicationBuilderRequest.BuilderQuestionRequest;
import com.vsa.dto.request.SaveApplicationBuilderRequest.BuilderRoleRequest;
import com.vsa.dto.request.SaveApplicationBuilderRequest.BuilderSectionRequest;
import com.vsa.dto.request.SaveApplicationRequest;
import com.vsa.dto.request.SaveQuestionRequest;
import com.vsa.dto.request.SaveRoleRequest;
import com.vsa.dto.request.SaveSectionRequest;
import com.vsa.dto.response.ApplicationAnswerResponse;
import com.vsa.dto.response.ApplicationBuilderResponse;
import com.vsa.dto.response.ApplicationOverviewResponse;
import com.vsa.dto.response.ApplicationQuestionResponse;
import com.vsa.dto.response.ApplicationReviewResponse;
import com.vsa.dto.response.ApplicationReviewResponse.QuestionReviewResponse;
import com.vsa.dto.response.ApplicationReviewResponse.SectionReviewResponse;
import com.vsa.dto.response.ApplicationRoleResponse;
import com.vsa.dto.response.ApplicationSectionResponse;
import com.vsa.dto.response.OfficerApplicationResponse;
import com.vsa.dto.response.QuestionOptionResponse;
import com.vsa.dto.response.RecruitmentStatusResponse;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.ApplicationAnswer;
import com.vsa.model.ApplicationAnswerOption;
import com.vsa.model.ApplicationQuestion;
import com.vsa.model.ApplicationQuestionOption;
import com.vsa.model.ApplicationRecruitmentSettings;
import com.vsa.model.ApplicationRole;
import com.vsa.model.ApplicationSection;
import com.vsa.model.ApplicationSectionRole;
import com.vsa.model.OfficerApplication;
import com.vsa.model.OfficerApplicationStatus;
import com.vsa.model.User;
import com.vsa.repository.ApplicationAnswerRepository;
import com.vsa.repository.ApplicationQuestionRepository;
import com.vsa.repository.ApplicationRecruitmentSettingsRepository;
import com.vsa.repository.ApplicationRoleRepository;
import com.vsa.repository.ApplicationSectionRepository;
import com.vsa.repository.ApplicationSectionRoleRepository;
import com.vsa.repository.OfficerApplicationRepository;
import com.vsa.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class ApplicationService {

    private static final String GET_TO_KNOW_YOU
            = "GET_TO_KNOW_YOU";

    private static final Set<String> QUESTION_TYPES
            = Set.of(
                    "short_text",
                    "long_text",
                    "number",
                    "email",
                    "phone",
                    "single_choice",
                    "multiple_choice",
                    "date",
                    "url"
            );

    private static final Set<String> CHOICE_TYPES
            = Set.of(
                    "single_choice",
                    "multiple_choice"
            );

    private final ApplicationRecruitmentSettingsRepository recruitmentSettingsRepository;

    private final ApplicationRoleRepository roleRepository;

    private final ApplicationSectionRepository sectionRepository;

    private final ApplicationSectionRoleRepository sectionRoleRepository;

    private final ApplicationQuestionRepository questionRepository;

    private final OfficerApplicationRepository officerApplicationRepository;

    private final ApplicationAnswerRepository answerRepository;

    private final UserRepository userRepository;

    public ApplicationService(
            ApplicationRecruitmentSettingsRepository recruitmentSettingsRepository,
            ApplicationRoleRepository roleRepository,
            ApplicationSectionRepository sectionRepository,
            ApplicationSectionRoleRepository sectionRoleRepository,
            ApplicationQuestionRepository questionRepository,
            OfficerApplicationRepository officerApplicationRepository,
            ApplicationAnswerRepository answerRepository,
            UserRepository userRepository
    ) {
        this.recruitmentSettingsRepository
                = recruitmentSettingsRepository;

        this.roleRepository
                = roleRepository;

        this.sectionRepository
                = sectionRepository;

        this.sectionRoleRepository
                = sectionRoleRepository;

        this.questionRepository
                = questionRepository;

        this.officerApplicationRepository
                = officerApplicationRepository;

        this.answerRepository
                = answerRepository;

        this.userRepository
                = userRepository;
    }

    // =========================================================
    // GLOBAL RECRUITMENT
    // =========================================================
    public RecruitmentStatusResponse getRecruitmentStatus() {

        ApplicationRecruitmentSettings settings
                = requireRecruitmentSettings();

        return new RecruitmentStatusResponse(
                settings.isRecruitmentOpen(),
                settings.getUpdatedAt()
        );
    }

    public RecruitmentStatusResponse setRecruitmentOpen(
            boolean recruitmentOpen
    ) {

        ApplicationRecruitmentSettings settings
                = requireRecruitmentSettings();

        if (recruitmentOpen) {
            validateRecruitmentCanOpen();
        }

        settings.setRecruitmentOpen(recruitmentOpen);

        ApplicationRecruitmentSettings saved
                = recruitmentSettingsRepository.save(settings);

        return new RecruitmentStatusResponse(
                saved.isRecruitmentOpen(),
                saved.getUpdatedAt()
        );
    }

    private void validateRecruitmentCanOpen() {

        List<ApplicationRole> recruitingRoles
                = roleRepository
                        .findByRecruitingTrueOrderByCreatedAtAsc();

        if (recruitingRoles.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one officer role must be open for recruitment."
            );
        }

        for (ApplicationRole role : recruitingRoles) {
            validateRoleReady(role);
        }
    }

    private void validateRoleReady(ApplicationRole role) {
        List<ApplicationSectionRole> sectionRoles
                = sectionRoleRepository
                        .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                                role.getApplicationRoleId()
                        );

        if (sectionRoles.isEmpty()) {
            throw new IllegalArgumentException(
                    role.getName()
                    + " does not have any application sections."
            );
        }

        ApplicationSection getToKnowYouSection
                = sectionRoles.stream()
                        .map(
                                ApplicationSectionRole::getSection
                        )
                        .filter(
                                section
                                -> GET_TO_KNOW_YOU.equals(
                                        section.getSystemKey()
                                )
                        )
                        .findFirst()
                        .orElseThrow(
                                ()
                                -> new IllegalArgumentException(
                                        role.getName()
                                        + " does not have the Get to Know You section."
                                )
                        );


        /*
         * Get to Know You must always contain at least
         * one active question because it is permanent
         * and always visible to applicants.
         */
        List<ApplicationQuestion> getToKnowYouQuestions
                = getToKnowYouSection
                        .getQuestions()
                        .stream()
                        .filter(
                                ApplicationQuestion::isActive
                        )
                        .toList();

        if (getToKnowYouQuestions.isEmpty()) {
            throw new IllegalArgumentException(
                    "The Get to Know You section must contain at least one active question."
            );
        }


        /*
         * Validate every question that is currently active.
         *
         * Custom sections with zero active questions are
         * considered drafts and are allowed.
         */
        for (ApplicationSectionRole relation
                : sectionRoles) {

            ApplicationSection section
                    = relation.getSection();

            List<ApplicationQuestion> activeQuestions
                    = section.getQuestions()
                            .stream()
                            .filter(
                                    ApplicationQuestion::isActive
                            )
                            .toList();


            /*
        * Empty custom section = draft.
             */
            if (activeQuestions.isEmpty()
                    && !isGetToKnowYou(section)) {
                continue;
            }

            for (ApplicationQuestion question
                    : activeQuestions) {

                if (CHOICE_TYPES.contains(
                        question.getQuestionType()
                )
                        && question.getOptions().isEmpty()) {
                    throw new IllegalArgumentException(
                            "Question \""
                            + question.getQuestionText()
                            + "\" must have at least one option."
                    );
                }
            }
        }
    }
// =========================================================
// BULK APPLICATION BUILDER SAVE
// =========================================================

    public ApplicationBuilderResponse saveApplicationBuilder(
            SaveApplicationBuilderRequest request
    ) {

        /*
     * Validate the shape of the draft before changing anything.
         */
        validateBuilderRoleNames(request.roles());

        validateBuilderRoleIds(request.roles());

        validateBuilderSectionIds(
                request.sections()
        );


        /*
     * =====================================================
     * 1. DELETE ROLES THAT WERE REMOVED IN THE FRONTEND
     * =====================================================
         */
        Set<Long> requestedExistingRoleIds
                = request.roles()
                        .stream()
                        .map(
                                BuilderRoleRequest::applicationRoleId
                        )
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

        List<ApplicationRole> existingRoles
                = roleRepository
                        .findAllByOrderByCreatedAtAsc();

        for (ApplicationRole existingRole : existingRoles) {

            if (!requestedExistingRoleIds.contains(
                    existingRole.getApplicationRoleId()
            )) {

                /*
             * Reuse existing deletion protection.
             *
             * This refuses deletion if applications
             * already exist for the role.
                 */
                deleteRole(
                        existingRole.getApplicationRoleId()
                );
            }
        }


        /*
     * Important if a deleted role's name is immediately
     * reused by a newly created role.
         */
        roleRepository.flush();


        /*
     * =====================================================
     * 2. CREATE / UPDATE ROLES
     * =====================================================
     *
     * Keep the entities in the same order as request.roles().
     * We'll need them later when creating role-section
     * relationships.
         */
        List<ApplicationRole> savedRoleEntities
                = new ArrayList<>();

        for (BuilderRoleRequest roleRequest
                : request.roles()) {

            ApplicationRole role;

            if (roleRequest.applicationRoleId() == null) {

                role = new ApplicationRole();

            } else {

                if (roleRequest.applicationRoleId() <= 0) {

                    throw new IllegalArgumentException(
                            "Existing role IDs must be positive."
                    );
                }

                role = requireRole(
                        roleRequest.applicationRoleId()
                );
            }

            role.setName(
                    roleRequest.name().trim()
            );

            role.setDescription(
                    trimToNull(
                            roleRequest.description()
                    )
            );

            role.setRecruiting(
                    roleRequest.recruiting()
            );

            savedRoleEntities.add(
                    roleRepository.save(role)
            );
        }

        roleRepository.flush();


        /*
     * =====================================================
     * 3. CREATE / UPDATE SECTIONS
     * =====================================================
     *
     * clientId lets the frontend reference new unsaved
     * sections using negative IDs.
     *
     * Example:
     *
     * -3 -> database section 14
         */
        List<ApplicationSection> existingSectionsBeforeSave
                = sectionRepository.findAll();

        Set<Long> requestedExistingSectionIds
                = new HashSet<>();

        Map<Long, ApplicationSection> sectionsByClientId
                = new HashMap<>();

        for (BuilderSectionRequest sectionRequest
                : request.sections()) {

            ApplicationSection section;


            /*
         * EXISTING SECTION
             */
            if (sectionRequest.sectionId() != null) {

                if (sectionRequest.sectionId() <= 0) {

                    throw new IllegalArgumentException(
                            "Existing section IDs must be positive."
                    );
                }

                requestedExistingSectionIds.add(
                        sectionRequest.sectionId()
                );

                section
                        = requireSection(
                                sectionRequest.sectionId()
                        );


                /*
             * Get to Know You is permanent.
             *
             * Officers may edit its questions,
             * but not its own heading/description.
                 */
                if (isGetToKnowYou(section)) {

                    boolean headingChanged
                            = !section
                                    .getSectionHeading()
                                    .equals(
                                            sectionRequest
                                                    .sectionHeading()
                                                    .trim()
                                    );

                    boolean descriptionChanged
                            = !Objects.equals(
                                    trimToNull(
                                            section.getSectionDescription()
                                    ),
                                    trimToNull(
                                            sectionRequest
                                                    .sectionDescription()
                                    )
                            );

                    if (headingChanged
                            || descriptionChanged) {

                        throw new IllegalArgumentException(
                                "The Get to Know You section title and description cannot be changed."
                        );
                    }

                } else {

                    section.setSectionHeading(
                            sectionRequest
                                    .sectionHeading()
                                    .trim()
                    );

                    section.setSectionDescription(
                            trimToNull(
                                    sectionRequest
                                            .sectionDescription()
                            )
                    );
                }

            } /*
         * NEW SECTION
             */ else {

                if (sectionRequest.clientId() >= 0) {

                    throw new IllegalArgumentException(
                            "New sections must use a negative temporary client ID."
                    );
                }

                section = new ApplicationSection();

                section.setSectionHeading(
                        sectionRequest
                                .sectionHeading()
                                .trim()
                );

                section.setSectionDescription(
                        trimToNull(
                                sectionRequest
                                        .sectionDescription()
                        )
                );


                /*
             * Browser cannot create system sections.
                 */
                section.setSystemKey(null);

                section
                        = sectionRepository.save(section);
            }

            if (sectionsByClientId.put(
                    sectionRequest.clientId(),
                    section
            ) != null) {

                throw new IllegalArgumentException(
                        "Section client IDs must be unique."
                );
            }


            /*
         * Questions belong to the section.
             */
            syncBuilderQuestions(
                    section,
                    sectionRequest.questions()
            );

            sectionRepository.save(section);
        }

        sectionRepository.flush();
        questionRepository.flush();


        /*
     * =====================================================
     * 4. CHECK THAT CUSTOM SECTIONS BELONG TO A ROLE
     * =====================================================
         */
        Set<Long> referencedSectionClientIds
                = new HashSet<>();

        for (BuilderRoleRequest roleRequest
                : request.roles()) {

            Set<Long> roleSectionIds
                    = new HashSet<>();

            for (Long clientId
                    : roleRequest.sectionClientIds()) {

                if (!roleSectionIds.add(clientId)) {

                    throw new IllegalArgumentException(
                            "The same section cannot appear twice in one role."
                    );
                }

                referencedSectionClientIds.add(
                        clientId
                );
            }
        }

        for (BuilderSectionRequest sectionRequest
                : request.sections()) {

            ApplicationSection section
                    = sectionsByClientId.get(
                            sectionRequest.clientId()
                    );


            /*
         * GTKY can survive without a role.
         *
         * For example, all roles may be deleted while
         * recruitment is closed.
             */
            if (isGetToKnowYou(section)) {
                continue;
            }

            if (!referencedSectionClientIds.contains(
                    sectionRequest.clientId()
            )) {

                throw new IllegalArgumentException(
                        "Section \""
                        + section.getSectionHeading()
                        + "\" must belong to at least one officer role."
                );
            }
        }


        /*
     * =====================================================
     * 5. SAVE ROLE <-> SECTION RELATIONSHIPS + ORDER
     * =====================================================
         */
        for (int roleIndex = 0;
                roleIndex < request.roles().size();
                roleIndex++) {

            BuilderRoleRequest roleRequest
                    = request.roles().get(roleIndex);

            ApplicationRole role
                    = savedRoleEntities.get(roleIndex);

            syncBuilderRoleSections(
                    role,
                    roleRequest.sectionClientIds(),
                    sectionsByClientId
            );
        }

        sectionRoleRepository.flush();


        /*
     * =====================================================
     * 6. DELETE SECTIONS REMOVED FROM THE DRAFT
     * =====================================================
     *
     * Existing deleteSection() already knows:
     *
     * - never delete GTKY
     * - preserve historical sections/questions
     * - remove relationships when historical answers exist
         */
        for (ApplicationSection existingSection
                : existingSectionsBeforeSave) {

            if (isGetToKnowYou(existingSection)) {
                continue;
            }

            if (!requestedExistingSectionIds.contains(
                    existingSection.getSectionId()
            )) {

                deleteSection(
                        existingSection.getSectionId()
                );
            }
        }

        sectionRepository.flush();
        sectionRoleRepository.flush();
        questionRepository.flush();


        /*
     * =====================================================
     * 7. VALIDATE FINAL LIVE RECRUITMENT STATE
     * =====================================================
     *
     * Do this AFTER all form changes exist in the current
     * transaction.
         */
        if (request.recruitmentOpen()) {

            validateRecruitmentCanOpen();
        }


        /*
     * =====================================================
     * 8. SAVE GLOBAL RECRUITMENT STATUS
     * =====================================================
         */
        ApplicationRecruitmentSettings settings
                = requireRecruitmentSettings();

        settings.setRecruitmentOpen(
                request.recruitmentOpen()
        );

        recruitmentSettingsRepository.save(
                settings
        );

        recruitmentSettingsRepository.flush();


        /*
     * =====================================================
     * 9. RETURN FRESH DATABASE STATE
     * =====================================================
     *
     * Temporary frontend IDs are gone now.
     * The response contains the real generated DB IDs.
         */
        return new ApplicationBuilderResponse(
                getRecruitmentStatus(),
                getAllRoles()
        );
    }

    // =========================================================
    // APPLICATION ROLES
    // =========================================================
    public List<ApplicationRoleResponse> getAllRoles() {

        return roleRepository
                .findAllByOrderByCreatedAtAsc()
                .stream()
                .map(
                        role
                        -> toRoleResponse(
                                role,
                                true
                        )
                )
                .toList();
    }

    /**
     * Public roles shown to students.
     *
     * If global recruitment is closed, return no roles.
     */
    public List<ApplicationRoleResponse> getOpenRoles() {

        if (!requireRecruitmentSettings()
                .isRecruitmentOpen()) {
            return List.of();
        }

        return roleRepository
                .findByRecruitingTrueOrderByCreatedAtAsc()
                .stream()
                .map(
                        role
                        -> toRoleResponse(
                                role,
                                false
                        )
                )
                .toList();
    }

    public ApplicationRoleResponse getRole(
            Long roleId
    ) {

        return toRoleResponse(
                requireRole(roleId),
                true
        );
    }

    public ApplicationRoleResponse createRole(
            SaveRoleRequest request
    ) {

        String name
                = request.name().trim();

        if (roleRepository
                .existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(
                    "An application role with this name already exists."
            );
        }

        ApplicationRole role
                = new ApplicationRole();

        role.setName(name);

        role.setDescription(
                trimToNull(
                        request.description()
                )
        );

        /*
         * New roles start closed.
         */
        role.setRecruiting(false);

        ApplicationRole savedRole
                = roleRepository.save(role);

        /*
         * Every new role automatically receives
         * the permanent Get to Know You section.
         */
        ApplicationSection getToKnowYou
                = requireGetToKnowYouSection();

        ApplicationSectionRole relation
                = new ApplicationSectionRole();

        relation.setApplicationRole(savedRole);
        relation.setSection(getToKnowYou);
        relation.setDisplayOrder(1);

        sectionRoleRepository.save(relation);

        return toRoleResponse(
                savedRole,
                true
        );
    }

    public ApplicationRoleResponse updateRole(
            Long roleId,
            SaveRoleRequest request
    ) {
        ApplicationRole role
                = requireRole(roleId);

        String name
                = request.name().trim();

        boolean nameChanged
                = !role.getName()
                        .equalsIgnoreCase(name);

        if (nameChanged
                && roleRepository
                        .existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(
                    "An application role with this name already exists."
            );
        }

        role.setName(name);

        role.setDescription(
                trimToNull(
                        request.description()
                )
        );

        return toRoleResponse(
                roleRepository.save(role),
                true
        );
    }

    /**
     * Used by:
     *
     * "Which officer role is open for recruitment this cycle?"
     */
    public ApplicationRoleResponse setRoleRecruiting(
            Long roleId,
            boolean recruiting
    ) {

        ApplicationRole role
                = requireRole(roleId);

        /*
         * If recruitment is already globally open,
         * do not expose an unfinished role.
         */
        if (recruiting
                && requireRecruitmentSettings()
                        .isRecruitmentOpen()) {
            validateRoleReady(role);
        }

        role.setRecruiting(recruiting);

        return toRoleResponse(
                roleRepository.save(role),
                true
        );
    }

    public void deleteRole(
            Long roleId
    ) {

        ApplicationRole role
                = requireRole(roleId);

        if (officerApplicationRepository
                .existsByApplicationRoleApplicationRoleId(
                        roleId
                )) {
            throw new IllegalArgumentException(
                    "This officer role cannot be deleted because applications already exist for it."
            );
        }

        roleRepository.delete(role);
    }

    // =========================================================
    // SECTIONS
    // =========================================================
    public List<ApplicationSectionResponse> getSectionsForRole(
            Long roleId
    ) {

        requireRole(roleId);

        return sectionRoleRepository
                .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                        roleId
                )
                .stream()
                .map(
                        relation
                        -> toSectionResponse(
                                relation,
                                false
                        )
                )
                .toList();
    }

    public ApplicationSectionResponse getSection(
            Long sectionId
    ) {

        return toSectionResponse(
                requireSection(sectionId),
                true
        );
    }

    public ApplicationSectionResponse createSection(
            SaveSectionRequest request
    ) {

        List<Long> roleIds
                = distinctRoleIds(
                        request.roleIds()
                );

        if (roleIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "A section must belong to at least one officer role."
            );
        }

        ApplicationSection section
                = new ApplicationSection();

        section.setSectionHeading(
                request.sectionHeading().trim()
        );

        section.setSectionDescription(
                trimToNull(
                        request.sectionDescription()
                )
        );

        /*
         * Custom officer-created sections do not
         * receive a system key.
         */
        section.setSystemKey(null);

        ApplicationSection saved
                = sectionRepository.save(section);

        for (Long roleId : roleIds) {

            ApplicationRole role
                    = requireRole(roleId);

            ApplicationSectionRole relation
                    = new ApplicationSectionRole();

            relation.setApplicationRole(role);
            relation.setSection(saved);

            relation.setDisplayOrder(
                    nextSectionDisplayOrder(roleId)
            );

            sectionRoleRepository.save(relation);
        }

        return toSectionResponse(
                saved,
                true
        );
    }

    public ApplicationSectionResponse updateSection(
            Long sectionId,
            SaveSectionRequest request
    ) {

        ApplicationSection section
                = requireSection(sectionId);

        if (isGetToKnowYou(section)) {
            throw new IllegalArgumentException(
                    "The Get to Know You section title and description cannot be changed."
            );
        }

        section.setSectionHeading(
                request.sectionHeading().trim()
        );

        section.setSectionDescription(
                trimToNull(
                        request.sectionDescription()
                )
        );

        sectionRepository.save(section);

        updateSectionRoles(
                section,
                request.roleIds()
        );

        return toSectionResponse(
                section,
                true
        );
    }

    public void deleteSection(
            Long sectionId
    ) {

        ApplicationSection section
                = requireSection(sectionId);

        if (isGetToKnowYou(section)) {
            throw new IllegalArgumentException(
                    "The Get to Know You section cannot be deleted."
            );
        }
        officerApplicationRepository.clearCurrentSectionBySectionId(sectionId);

        boolean hasHistoricalAnswers
                = section.getQuestions()
                        .stream()
                        .anyMatch(
                                question
                                -> question.getQuestionId() != null
                                && answerRepository
                                        .existsByQuestionQuestionId(
                                                question.getQuestionId()
                                        )
                        );

        if (hasHistoricalAnswers) {

            /*
             * Preserve the section/questions because old
             * completed applications depend on them.
             *
             * Removing every role relationship hides the
             * section from future applications.
             */
            List<ApplicationSectionRole> relationships
                    = sectionRoleRepository
                            .findBySectionSectionId(
                                    sectionId
                            );

            sectionRoleRepository.deleteAll(
                    relationships
            );

            return;
        }

        sectionRepository.delete(section);
    }

    private void updateSectionRoles(
            ApplicationSection section,
            List<Long> requestedRoleIds
    ) {

        List<Long> roleIds
                = distinctRoleIds(
                        requestedRoleIds
                );

        if (roleIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "A section must belong to at least one officer role."
            );
        }

        List<ApplicationSectionRole> existing
                = sectionRoleRepository
                        .findBySectionSectionId(
                                section.getSectionId()
                        );

        Set<Long> desired
                = new HashSet<>(roleIds);

        Set<Long> existingRoleIds
                = existing.stream()
                        .map(
                                relation
                                -> relation
                                        .getApplicationRole()
                                        .getApplicationRoleId()
                        )
                        .collect(
                                Collectors.toSet()
                        );

        /*
         * Remove roles that are no longer selected.
         */
        List<ApplicationSectionRole> toRemove
                = existing.stream()
                        .filter(
                                relation
                                -> !desired.contains(
                                        relation
                                                .getApplicationRole()
                                                .getApplicationRoleId()
                                )
                        )
                        .toList();

        sectionRoleRepository.deleteAll(
                toRemove
        );

        /*
         * Add newly selected roles.
         */
        for (Long roleId : roleIds) {

            if (existingRoleIds.contains(roleId)) {
                continue;
            }

            ApplicationRole role
                    = requireRole(roleId);

            ApplicationSectionRole relation
                    = new ApplicationSectionRole();

            relation.setApplicationRole(role);
            relation.setSection(section);

            relation.setDisplayOrder(
                    nextSectionDisplayOrder(roleId)
            );

            sectionRoleRepository.save(relation);
        }
    }

    private int nextSectionDisplayOrder(
            Long roleId
    ) {

        return sectionRoleRepository
                .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                        roleId
                )
                .stream()
                .mapToInt(
                        ApplicationSectionRole::getDisplayOrder
                )
                .max()
                .orElse(0)
                + 1;
    }

    // =========================================================
    // QUESTIONS
    // =========================================================
    public ApplicationQuestionResponse getQuestion(
            Long questionId
    ) {

        return toQuestionResponse(
                requireQuestion(questionId)
        );
    }

    public ApplicationQuestionResponse createQuestion(Long sectionId, SaveQuestionRequest request) {

        ApplicationSection section = requireSection(sectionId);

        ApplicationQuestion question = new ApplicationQuestion();

        applyQuestion(question, request);

        question.setSection(section);

        int nextOrder
                = section.getQuestions()
                        .stream()
                        .mapToInt(
                                ApplicationQuestion::getOrderNum
                        )
                        .max()
                        .orElse(0)
                + 1;

        question.setOrderNum(
                nextOrder
        );

        question.setActive(true);

        ApplicationQuestion saved
                = questionRepository.save(question);

        applyQuestionOptions(
                saved,
                request.options()
        );

        saved
                = questionRepository.save(saved);

        return toQuestionResponse(saved);
    }

    public ApplicationQuestionResponse updateQuestion(Long questionId, SaveQuestionRequest request) {

        ApplicationQuestion question = requireQuestion(questionId);

        /*
         * Once somebody has answered the question,
         * changing its wording/type/options would change
         * the meaning of historical applications.
         *
         * Officers can deactivate it instead.
         */
        if (answerRepository
                .existsByQuestionQuestionId(
                        questionId
                )) {
            throw new IllegalArgumentException(
                    "This question already has application answers. Deactivate it instead of editing it."
            );
        }

        applyQuestion(question, request);

        applyQuestionOptions(question, request.options());

        return toQuestionResponse(questionRepository.save(question));
    }

    /**
     * "Delete Question" in the UI should call this.
     *
     * We soft-delete questions so old applications remain intact.
     */
    public void deactivateQuestion(Long questionId) {
        ApplicationQuestion question = requireQuestion(questionId);
        question.setActive(false);
        questionRepository.save(question);
    }

    private void applyQuestion(ApplicationQuestion question, SaveQuestionRequest request) {

        String type
                = request.questionType()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        if (!QUESTION_TYPES.contains(type)) {
            throw new IllegalArgumentException(
                    "Unsupported question type: "
                    + type
            );
        }

        question.setQuestionText(request.questionText().trim());

        question.setQuestionType(type);

        question.setRequired(request.required());
    }

    private void applyQuestionOptions(ApplicationQuestion question, List<String> requestedOptions) {

        boolean choiceQuestion = CHOICE_TYPES.contains(question.getQuestionType());

        List<String> options
                = requestedOptions == null
                        ? List.of()
                        : requestedOptions.stream()
                                .map(
                                        value
                                        -> value == null
                                                ? ""
                                                : value.trim()
                                )
                                .filter(
                                        value
                                        -> !value.isBlank()
                                )
                                .toList();

        if (!choiceQuestion) {

            if (!options.isEmpty()) {
                throw new IllegalArgumentException(
                        "Only single-choice and multiple-choice questions can have options."
                );
            }

            question.getOptions().clear();

            return;
        }

        if (options.isEmpty()) {
            throw new IllegalArgumentException(
                    "Choice questions must have at least one option."
            );
        }

        Set<String> uniqueOptions
                = options.stream()
                        .map(
                                value
                                -> value.toLowerCase(
                                        Locale.ROOT
                                )
                        )
                        .collect(
                                Collectors.toSet()
                        );

        if (uniqueOptions.size()
                != options.size()) {
            throw new IllegalArgumentException(
                    "A question cannot contain duplicate options."
            );
        }

        // question.getOptions().clear();
        List<ApplicationQuestionOption> currentOption = question.getOptions();
        // int displayOrder = 1;

        for (int index = 0; index < options.size(); index++) {
            String optionText = options.get(index);
            int displayOrder = index + 1;
            if (index < currentOption.size()) {
                ApplicationQuestionOption option = currentOption.get(index);
                option.setOptionText(optionText);
            } else {
                ApplicationQuestionOption option = new ApplicationQuestionOption();
                option.setQuestion(question);
                option.setOptionText(optionText);
                option.setDisplayOrder(displayOrder);
                currentOption.add(option);
            }
        }

        while (currentOption.size() > options.size()) {
            currentOption.remove(currentOption.size() - 1);
        }
    }

    // =========================================================
    // STUDENT APPLICATION — START / RESUME
    // =========================================================
    public OfficerApplicationResponse startApplication(
            String email,
            Long applicationRoleId
    ) {

        requireRecruitmentOpen();

        ApplicationRole role
                = requireRole(applicationRoleId);

        if (!role.isRecruiting()) {
            throw new IllegalArgumentException(
                    role.getName()
                    + " is not currently accepting applications."
            );
        }

        /*
         * Defensive validation in case the DB was changed
         * outside the normal recruitment-open flow.
         */
        validateRoleReady(role);

        User user
                = requireUser(email);

        Optional<OfficerApplication> existing
                = officerApplicationRepository
                        .findByUserUidAndApplicationRoleApplicationRoleId(
                                user.getUid(),
                                applicationRoleId
                        );

        /*
         * Existing IN_PROGRESS → resume.
         * Existing COMPLETED   → return read-only application.
         */
        if (existing.isPresent()) {
            return toApplicationResponse(
                    existing.get()
            );
        }

        OfficerApplication application
                = new OfficerApplication();

        application.setUser(user);

        application.setApplicationRole(role);

        application.setStatus(
                OfficerApplicationStatus.IN_PROGRESS
        );

        OfficerApplication saved
                = officerApplicationRepository.save(
                        application
                );

        prefillGetToKnowYou(
                saved
        );

        return toApplicationResponse(
                saved
        );
    }

    // =========================================================
    // STUDENT APPLICATION — SAVE
    // =========================================================
    public OfficerApplicationResponse saveApplication(
            String email,
            Integer applicationId,
            SaveApplicationRequest request
    ) {

        OfficerApplication application
                = requireOwnedApplication(
                        email,
                        applicationId
                );

        ensureEditable(application);

        ensureApplicationCurrentlyOpen(
                application
        );

        if (request.currentSectionId() != null) {
            Long currentSectionId = request.currentSectionId();

            boolean sectionBelongsToRole = sectionRoleRepository
                    .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(application
                            .getApplicationRole()
                            .getApplicationRoleId()
                    )
                    .stream()
                    .anyMatch(relation -> relation
                    .getSection()
                    .getSectionId()
                    .equals(currentSectionId)
                    );

            if (!sectionBelongsToRole) {
                throw new IllegalArgumentException("The current section does not belong to this application role.");
            }
            ApplicationSection currentSection = requireSection(currentSectionId);
            application.setCurrentSection(currentSection);
        }

        saveAnswers(application, request.answers());

        /*
         * Explicitly mark the parent application as changed
         * so updated_at also reflects answer-only edits.
         */
        application.setUpdatedAt(
                LocalDateTime.now()
        );

        OfficerApplication saved
                = officerApplicationRepository.save(
                        application
                );

        return toApplicationResponse(saved);
    }

    // =========================================================
    // STUDENT APPLICATION — SUBMIT
    // =========================================================
    public OfficerApplicationResponse submitApplication(
            String email,
            Integer applicationId,
            SaveApplicationRequest request
    ) {

        OfficerApplication application
                = requireOwnedApplication(
                        email,
                        applicationId
                );

        ensureEditable(application);

        ensureApplicationCurrentlyOpen(
                application
        );

        saveAnswers(
                application,
                request.answers()
        );

        validateRequiredAnswers(
                application
        );

        application.setStatus(
                OfficerApplicationStatus.COMPLETED
        );

        application.setSubmittedAt(
                LocalDateTime.now()
        );

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        OfficerApplication saved
                = officerApplicationRepository.save(
                        application
                );

        return toApplicationResponse(saved);
    }

    private void ensureApplicationCurrentlyOpen(
            OfficerApplication application
    ) {

        requireRecruitmentOpen();

        if (!application
                .getApplicationRole()
                .isRecruiting()) {
            throw new IllegalArgumentException(
                    "This officer position is no longer accepting applications."
            );
        }
    }

    // =========================================================
    // STUDENT APPLICATION — READ
    // =========================================================
    public List<OfficerApplicationResponse> getMyApplications(
            String email
    ) {

        User user
                = requireUser(email);

        return officerApplicationRepository
                .findByUserUidOrderByUpdatedAtDesc(
                        user.getUid()
                )
                .stream()
                .map(this::toApplicationResponse)
                .toList();
    }

    public OfficerApplicationResponse getMyApplication(
            String email,
            Integer applicationId
    ) {

        return toApplicationResponse(
                requireOwnedApplication(
                        email,
                        applicationId
                )
        );
    }

    public ApplicationReviewResponse getMySubmittedApplicationReview(
            String email,
            Integer applicationId
    ) {

        OfficerApplication application
                = requireOwnedApplication(
                        email,
                        applicationId
                );

        if (application.getStatus()
                != OfficerApplicationStatus.COMPLETED) {

            throw new IllegalArgumentException(
                    "Only submitted applications can be viewed."
            );
        }

        return buildApplicationReviewResponse(
                application
        );
    }

    // =========================================================
    // OFFICER APPLICATION REVIEW
    // =========================================================
    public List<OfficerApplicationResponse> getAllApplications(
            OfficerApplicationStatus status
    ) {

        List<OfficerApplication> applications
                = status == null
                        ? officerApplicationRepository
                                .findAllByOrderByCreatedAtDesc()
                        : officerApplicationRepository
                                .findByStatusOrderByCreatedAtDesc(
                                        status
                                );

        return applications.stream()
                .map(this::toApplicationResponse)
                .toList();
    }

    public OfficerApplicationResponse getApplication(
            Integer applicationId
    ) {

        return toApplicationResponse(
                requireApplication(
                        applicationId
                )
        );
    }

    //For officers to view overview of all completed applications
    public ApplicationOverviewResponse getApplicationOverview() {

        // Application overview board only display COMPLETED applications for greater good and hide uncompleted application
        List<OfficerApplication> completedApplications
                = officerApplicationRepository.findByStatusOrderByCreatedAtDesc(OfficerApplicationStatus.COMPLETED);

        //Application overview also shows total applications by getting the size of "completedApplications"
        long totalApplicants = completedApplications.size();

        if (totalApplicants == 0) {
            return new ApplicationOverviewResponse(0, 0);
        }

        long totalApplicationSeconds = completedApplications.stream().mapToLong(application -> Duration.between(
                application.getCreatedAt(),
                application.getSubmittedAt()
        ).getSeconds()
        )
                .sum();
        long averageApplicationSeconds = Math.round(totalApplicationSeconds / (double) totalApplicants);
        return new ApplicationOverviewResponse(totalApplicants, averageApplicationSeconds);
    }

    //For officers to view one completed application in detail
    public ApplicationReviewResponse getSubmittedApplicationReview(Integer applicationId) {
        OfficerApplication application = requireApplication(applicationId);

        if (application.getStatus() != OfficerApplicationStatus.COMPLETED) {
            throw new IllegalArgumentException("Only completed applications can be reviewed.");
        }
        return buildApplicationReviewResponse(application);
    }

    private ApplicationReviewResponse buildApplicationReviewResponse(OfficerApplication application) {

        User user = application.getUser();
        List<ApplicationAnswer> answers = answerRepository.findByApplicationApplicationId(application.getApplicationId());

        Map<Long, Integer> sectionOrder = new LinkedHashMap<>();
        for (ApplicationSectionRole relation : sectionRoleRepository
                .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(application.getApplicationRole().getApplicationRoleId())) {

            sectionOrder.put(relation.getSection().getSectionId(), relation.getDisplayOrder());
        }


        /*
     * Group saved answers by the section their question
     * belongs to.
         */
        Map<ApplicationSection, List<ApplicationAnswer>> answersBySection
                = answers.stream().collect(Collectors.groupingBy(answer -> answer.getQuestion().getSection()));

        List<SectionReviewResponse> sections = answersBySection.entrySet().stream()
                .sorted(Comparator.comparingInt(entry -> sectionOrder.getOrDefault(entry.getKey().getSectionId(), Integer.MAX_VALUE)))
                .map(entry -> {
                    ApplicationSection section = entry.getKey();

                    List<QuestionReviewResponse> questions = entry.getValue().stream()
                            .sorted(Comparator.comparingInt(answer -> answer.getQuestion().getOrderNum()))
                            .map(answer -> {
                                ApplicationQuestion question = answer.getQuestion();
                                List<String> options = question.getOptions().stream().sorted(
                                        Comparator.comparingInt(ApplicationQuestionOption::getDisplayOrder)
                                ).map(ApplicationQuestionOption::getOptionText).toList();
                                List<String> selectedOptions = answer
                                        .getSelectedOptions()
                                        .stream()
                                        .sorted(Comparator.comparingInt(selected -> selected.getOption().getDisplayOrder()))
                                        .map(selected -> selected.getOption().getOptionText())
                                        .toList();

                                return new QuestionReviewResponse(
                                        question.getQuestionId(),
                                        question.getQuestionText(),
                                        question.getQuestionType(),
                                        question.isRequired(),
                                        question.getOrderNum(),
                                        answer.getAnswerText(),
                                        options,
                                        selectedOptions);
                            })
                            .toList();

                    return new SectionReviewResponse(
                            section.getSectionId(),
                            section.getSectionHeading(),
                            section.getSectionDescription(),
                            questions
                    );
                })
                .toList();

        return new ApplicationReviewResponse(
                application.getApplicationId(),
                application.getApplicationRole().getApplicationRoleId(),
                application.getApplicationRole().getName(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                application.getCreatedAt(),
                application.getSubmittedAt(),
                sections
        );
    }

    // =========================================================
    // ANSWER SAVING
    // =========================================================
    private void saveAnswers(
            OfficerApplication application,
            List<ApplicationAnswerRequest> requests
    ) {

        if (requests == null) {
            return;
        }

        List<ApplicationQuestion> availableQuestions
                = getActiveQuestionsForApplication(
                        application
                );

        Map<Long, ApplicationQuestion> questionMap
                = availableQuestions.stream()
                        .collect(
                                Collectors.toMap(
                                        ApplicationQuestion::getQuestionId,
                                        Function.identity()
                                )
                        );

        Set<Long> submittedQuestionIds
                = new HashSet<>();

        for (ApplicationAnswerRequest request : requests) {

            if (!submittedQuestionIds.add(
                    request.questionId()
            )) {
                throw new IllegalArgumentException(
                        "A question can only be answered once per request."
                );
            }

            ApplicationQuestion question
                    = questionMap.get(
                            request.questionId()
                    );

            if (question == null) {
                throw new IllegalArgumentException(
                        "Question "
                        + request.questionId()
                        + " is not part of this application."
                );
            }

            ApplicationAnswer answer
                    = answerRepository
                            .findByApplicationApplicationIdAndQuestionQuestionId(
                                    application.getApplicationId(),
                                    question.getQuestionId()
                            )
                            .orElseGet(
                                    () -> {
                                        ApplicationAnswer newAnswer
                                        = new ApplicationAnswer();

                                        newAnswer.setApplication(
                                                application
                                        );

                                        newAnswer.setQuestion(
                                                question
                                        );

                                        return newAnswer;
                                    }
                            );

            applyAnswer(
                    answer,
                    question,
                    request
            );

            answerRepository.save(answer);
        }
    }

    private void applyAnswer(
            ApplicationAnswer answer,
            ApplicationQuestion question,
            ApplicationAnswerRequest request
    ) {

        if (CHOICE_TYPES.contains(
                question.getQuestionType()
        )) {

            answer.setAnswerText(null);

            List<Long> optionIds
                    = request.optionIds() == null
                    ? List.of()
                    : request.optionIds();

            Set<Long> uniqueOptionIds
                    = new LinkedHashSet<>(
                            optionIds
                    );

            if (uniqueOptionIds.size()
                    != optionIds.size()) {
                throw new IllegalArgumentException(
                        "The same option cannot be selected more than once."
                );
            }

            if ("single_choice".equals(
                    question.getQuestionType()
            )
                    && uniqueOptionIds.size() > 1) {
                throw new IllegalArgumentException(
                        "A single-choice question may only have one selected option."
                );
            }

            Map<Long, ApplicationQuestionOption> validOptions
                    = question.getOptions()
                            .stream()
                            .collect(
                                    Collectors.toMap(
                                            ApplicationQuestionOption::getOptionId,
                                            Function.identity()
                                    )
                            );


            /*
         * Validate every requested option first.
             */
            for (Long optionId : uniqueOptionIds) {

                if (!validOptions.containsKey(optionId)) {

                    throw new IllegalArgumentException(
                            "Selected option "
                            + optionId
                            + " does not belong to question "
                            + question.getQuestionId()
                            + "."
                    );
                }
            }


            /*
         * Remove only options the user no longer selected.
         *
         * Do NOT clear everything and recreate it.
             */
            answer.getSelectedOptions()
                    .removeIf(
                            selected
                            -> !uniqueOptionIds.contains(
                                    selected
                                            .getOption()
                                            .getOptionId()
                            )
                    );


            /*
         * Find the option relationships that still exist.
             */
            Set<Long> existingOptionIds
                    = answer.getSelectedOptions()
                            .stream()
                            .map(
                                    selected
                                    -> selected
                                            .getOption()
                                            .getOptionId()
                            )
                            .collect(
                                    Collectors.toSet()
                            );


            /*
         * Add only genuinely new selections.
             */
            for (Long optionId : uniqueOptionIds) {

                if (existingOptionIds.contains(optionId)) {
                    continue;
                }

                ApplicationQuestionOption option
                        = validOptions.get(optionId);

                ApplicationAnswerOption selected
                        = new ApplicationAnswerOption();

                selected.setAnswer(answer);
                selected.setOption(option);

                answer.getSelectedOptions()
                        .add(selected);
            }

            return;
        }


        /*
     * Non-choice questions.
         */
        if (request.optionIds() != null
                && !request.optionIds().isEmpty()) {
            throw new IllegalArgumentException(
                    "This question does not accept selected options."
            );
        }

        answer.getSelectedOptions().clear();

        answer.setAnswerText(
                trimToNull(
                        request.answerText()
                )
        );
    }

    // =========================================================
    // REQUIRED ANSWER VALIDATION
    // =========================================================
    private void validateRequiredAnswers(
            OfficerApplication application
    ) {

        List<ApplicationQuestion> questions
                = getActiveQuestionsForApplication(
                        application
                );

        Map<Long, ApplicationAnswer> savedAnswers
                = answerRepository
                        .findByApplicationApplicationId(
                                application.getApplicationId()
                        )
                        .stream()
                        .collect(
                                Collectors.toMap(
                                        answer
                                        -> answer
                                                .getQuestion()
                                                .getQuestionId(),
                                        Function.identity()
                                )
                        );

        for (ApplicationQuestion question : questions) {

            if (!question.isRequired()) {
                continue;
            }

            ApplicationAnswer answer
                    = savedAnswers.get(
                            question.getQuestionId()
                    );

            if (answer == null) {
                throw requiredAnswerMissing(question);
            }

            if (CHOICE_TYPES.contains(
                    question.getQuestionType()
            )) {

                if (answer.getSelectedOptions()
                        .isEmpty()) {
                    throw requiredAnswerMissing(
                            question
                    );
                }

                continue;
            }

            if (answer.getAnswerText() == null
                    || answer.getAnswerText().isBlank()) {
                throw requiredAnswerMissing(
                        question
                );
            }
        }
    }

    private IllegalArgumentException requiredAnswerMissing(
            ApplicationQuestion question
    ) {

        return new IllegalArgumentException(
                "Required question was not answered: "
                + question.getQuestionText()
        );
    }

    // =========================================================
    // GET TO KNOW YOU PREFILL
    // =========================================================
    private void prefillGetToKnowYou(
            OfficerApplication application
    ) {

        ApplicationSection section
                = requireGetToKnowYouSection();

        User user
                = application.getUser();

        for (ApplicationQuestion question
                : section.getQuestions()) {

            if (!question.isActive()) {
                continue;
            }

            if (CHOICE_TYPES.contains(
                    question.getQuestionType()
            )) {
                continue;
            }

            String value
                    = getPrefillValue(
                            question,
                            user
                    );

            if (value == null) {
                continue;
            }

            ApplicationAnswer answer
                    = new ApplicationAnswer();

            answer.setApplication(application);
            answer.setQuestion(question);
            answer.setAnswerText(value);

            answerRepository.save(answer);
        }
    }

    /**
     * We currently identify the three prefilled questions by their question
     * text because application_questions does not have a system_key column.
     */
    private String getPrefillValue(
            ApplicationQuestion question,
            User user
    ) {

        String label
                = normalizeQuestionLabel(
                        question.getQuestionText()
                );

        if (label.equals("first name")
                || label.equals("what is your first name")) {
            return user.getFirstName();
        }

        if (label.equals("last name")
                || label.equals("what is your last name")) {
            return user.getLastName();
        }

        if (label.equals("email")
                || label.equals("email address")
                || label.equals("what is your email")
                || label.equals("what is your email address")) {
            return user.getEmail();
        }

        return null;
    }

    private String normalizeQuestionLabel(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // =========================================================
    // QUESTION LOOKUP FOR ONE APPLICATION
    // =========================================================
    private List<ApplicationQuestion> getActiveQuestionsForApplication(
            OfficerApplication application
    ) {

        Long roleId
                = application
                        .getApplicationRole()
                        .getApplicationRoleId();

        List<ApplicationQuestion> questions
                = new ArrayList<>();

        /*
         * sectionRoleRepository already returns sections
         * in display_order.
         *
         * ApplicationSection.questions is @OrderBy(orderNum ASC),
         * so we preserve:
         *
         * Section 1
         *   Question 1
         *   Question 2
         *
         * Section 2
         *   Question 1
         *   Question 2
         */
        for (ApplicationSectionRole relation
                : sectionRoleRepository
                        .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                                roleId
                        )) {

            relation.getSection()
                    .getQuestions()
                    .stream()
                    .filter(
                            ApplicationQuestion::isActive
                    )
                    .forEach(
                            questions::add
                    );
        }

        return questions;
    }

    // =========================================================
    // REQUIRE HELPERS
    // =========================================================
    private ApplicationRecruitmentSettings requireRecruitmentSettings() {

        List<ApplicationRecruitmentSettings> settings
                = recruitmentSettingsRepository.findAll();

        if (settings.isEmpty()) {
            throw new IllegalStateException(
                    "The application recruitment settings row does not exist."
            );
        }

        if (settings.size() > 1) {
            throw new IllegalStateException(
                    "More than one application recruitment settings row exists."
            );
        }

        return settings.get(0);
    }

    private void requireRecruitmentOpen() {

        if (!requireRecruitmentSettings()
                .isRecruitmentOpen()) {
            throw new IllegalArgumentException(
                    "Officer recruitment is currently closed."
            );
        }
    }

    private ApplicationRole requireRole(
            Long roleId
    ) {

        return roleRepository
                .findById(roleId)
                .orElseThrow(
                        ()
                        -> new ResourceNotFoundException(
                                "Application role",
                                roleId
                        )
                );
    }

    private ApplicationSection requireSection(
            Long sectionId
    ) {

        return sectionRepository
                .findById(sectionId)
                .orElseThrow(
                        ()
                        -> new ResourceNotFoundException(
                                "Application section",
                                sectionId
                        )
                );
    }

    private ApplicationQuestion requireQuestion(
            Long questionId
    ) {

        return questionRepository
                .findById(questionId)
                .orElseThrow(
                        ()
                        -> new ResourceNotFoundException(
                                "Application question",
                                questionId
                        )
                );
    }

    private ApplicationSection requireGetToKnowYouSection() {

        return sectionRepository
                .findBySystemKey(
                        GET_TO_KNOW_YOU
                )
                .orElseThrow(
                        ()
                        -> new IllegalStateException(
                                "The Get to Know You section does not exist."
                        )
                );
    }

    private User requireUser(
            String email
    ) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        ()
                        -> new IllegalArgumentException(
                                "Authenticated user was not found."
                        )
                );
    }

    private OfficerApplication requireApplication(
            Integer applicationId
    ) {

        return officerApplicationRepository
                .findById(applicationId)
                .orElseThrow(
                        ()
                        -> new ResourceNotFoundException(
                                "Officer application",
                                applicationId.longValue()
                        )
                );
    }

    private OfficerApplication requireOwnedApplication(
            String email,
            Integer applicationId
    ) {

        User user
                = requireUser(email);

        return officerApplicationRepository
                .findByApplicationIdAndUserUid(
                        applicationId,
                        user.getUid()
                )
                .orElseThrow(
                        ()
                        -> new ResourceNotFoundException(
                                "Officer application",
                                applicationId.longValue()
                        )
                );
    }

    private void ensureEditable(
            OfficerApplication application
    ) {

        if (application.getStatus()
                == OfficerApplicationStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Completed applications are read-only."
            );
        }
    }

    private boolean isGetToKnowYou(
            ApplicationSection section
    ) {

        return GET_TO_KNOW_YOU.equals(
                section.getSystemKey()
        );
    }

    private List<Long> distinctRoleIds(
            List<Long> roleIds
    ) {

        if (roleIds == null) {
            return List.of();
        }

        return new ArrayList<>(
                new LinkedHashSet<>(
                        roleIds
                )
        );
    }

    private ApplicationRoleResponse toRoleResponse(ApplicationRole role, boolean includeInactiveQuestions) {

        List<ApplicationSectionResponse> sections
                = sectionRoleRepository
                        .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                                role.getApplicationRoleId()
                        )
                        .stream()
                        .map(
                                relation
                                -> toSectionResponse(
                                        relation,
                                        includeInactiveQuestions
                                )
                        )
                        .filter(
                                section -> {

                                    /*
                                 * Officer builder:
                                 * show everything, including draft sections.
                                     */
                                    if (includeInactiveQuestions) {
                                        return true;
                                    }


                                    /*
                                 * Students:
                                 * Get to Know You always stays visible.
                                     */
                                    if (GET_TO_KNOW_YOU.equals(
                                            section.systemKey()
                                    )) {
                                        return true;
                                    }


                                    /*
                                 * Custom section with no active questions
                                 * is still a draft.
                                     */
                                    return !section.questions().isEmpty();
                                }
                        )
                        .toList();

        return new ApplicationRoleResponse(
                role.getApplicationRoleId(),
                role.getName(),
                role.getDescription(),
                role.isRecruiting(),
                sections,
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }

    private ApplicationSectionResponse toSectionResponse(
            ApplicationSectionRole relation,
            boolean includeInactiveQuestions
    ) {

        ApplicationSection section
                = relation.getSection();

        return createSectionResponse(
                section,
                relation.getDisplayOrder(),
                includeInactiveQuestions
        );
    }

    private ApplicationSectionResponse toSectionResponse(
            ApplicationSection section,
            boolean includeInactiveQuestions
    ) {

        return createSectionResponse(
                section,
                null,
                includeInactiveQuestions
        );
    }

    private ApplicationSectionResponse createSectionResponse(
            ApplicationSection section,
            Integer displayOrder,
            boolean includeInactiveQuestions
    ) {

        List<Long> roleIds
                = sectionRoleRepository
                        .findBySectionSectionId(
                                section.getSectionId()
                        )
                        .stream()
                        .map(
                                relation
                                -> relation
                                        .getApplicationRole()
                                        .getApplicationRoleId()
                        )
                        .toList();

        List<ApplicationQuestionResponse> questions
                = section.getQuestions()
                        .stream()
                        .filter(
                                question
                                -> includeInactiveQuestions
                                || question.isActive()
                        )
                        .map(this::toQuestionResponse)
                        .toList();

        return new ApplicationSectionResponse(
                section.getSectionId(),
                displayOrder,
                section.getSectionHeading(),
                section.getSectionDescription(),
                section.getSystemKey(),
                roleIds,
                questions
        );
    }

    private ApplicationQuestionResponse toQuestionResponse(
            ApplicationQuestion question
    ) {

        List<QuestionOptionResponse> options
                = question.getOptions()
                        .stream()
                        .map(
                                option
                                -> new QuestionOptionResponse(
                                        option.getOptionId(),
                                        option.getOptionText(),
                                        option.getDisplayOrder()
                                )
                        )
                        .toList();

        return new ApplicationQuestionResponse(
                question.getQuestionId(),
                question.getQuestionText(),
                question.getQuestionType(),
                question.isRequired(),
                question.getOrderNum(),
                question.isActive(),
                options
        );
    }

    private OfficerApplicationResponse toApplicationResponse(
            OfficerApplication application
    ) {

        User user
                = application.getUser();

        List<ApplicationAnswerResponse> answers
                = answerRepository
                        .findByApplicationApplicationId(
                                application.getApplicationId()
                        )
                        .stream()
                        .map(
                                answer
                                -> new ApplicationAnswerResponse(
                                        answer
                                                .getQuestion()
                                                .getQuestionId(),
                                        answer
                                                .getQuestion()
                                                .getQuestionText(),
                                        answer.getAnswerText(),
                                        answer.getSelectedOptions()
                                                .stream()
                                                .map(
                                                        selected
                                                        -> selected
                                                                .getOption()
                                                                .getOptionId()
                                                )
                                                .toList()
                                )
                        )
                        .toList();

        return new OfficerApplicationResponse(
                application.getApplicationId(),
                application
                        .getApplicationRole()
                        .getApplicationRoleId(),
                application
                        .getApplicationRole()
                        .getName(),
                user.getUid(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                application.getStatus(),
                answers,
                application.getCurrentSection() == null
                ? null
                : application
                        .getCurrentSection()
                        .getSectionId(),
                application.getCreatedAt(),
                application.getUpdatedAt(),
                application.getSubmittedAt()
        );
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void syncBuilderQuestions(
            ApplicationSection section,
            List<BuilderQuestionRequest> requests
    ) {

        List<BuilderQuestionRequest> safeRequests
                = requests == null
                        ? List.of()
                        : requests;


        /*
     * Take a snapshot BEFORE adding new questions.
         */
        List<ApplicationQuestion> existingQuestions
                = new ArrayList<>(
                        section.getQuestions()
                );

        Set<Long> requestedExistingQuestionIds
                = new HashSet<>();

        int orderNum = 1;

        for (BuilderQuestionRequest request
                : safeRequests) {


            /*
         * If a brand-new unsaved question was added and then
         * deleted before Save Changes, don't create an inactive
         * DB row for it.
             */
            if (request.questionId() == null
                    && !request.active()) {
                continue;
            }

            ApplicationQuestion question;


            /*
         * NEW QUESTION
             */
            if (request.questionId() == null) {

                question = new ApplicationQuestion();

                question.setSection(section);

                applyQuestion(
                        question,
                        new SaveQuestionRequest(
                                request.questionText(),
                                request.questionType(),
                                request.required(),
                                request.options()
                        )
                );

                applyQuestionOptions(
                        question,
                        request.options()
                );

                question.setActive(
                        request.active()
                );

                question.setOrderNum(
                        orderNum++
                );

                section.getQuestions().add(
                        question
                );

                questionRepository.save(
                        question
                );

                continue;
            }


            /*
         * EXISTING QUESTION
             */
            if (request.questionId() <= 0) {

                throw new IllegalArgumentException(
                        "Existing question IDs must be positive."
                );
            }

            if (!requestedExistingQuestionIds.add(
                    request.questionId()
            )) {

                throw new IllegalArgumentException(
                        "A question cannot appear more than once in a section."
                );
            }

            question
                    = requireQuestion(
                            request.questionId()
                    );


            /*
         * Do not allow somebody to move an existing question
         * into another section by crafting JSON manually.
             */
            if (!question
                    .getSection()
                    .getSectionId()
                    .equals(
                            section.getSectionId()
                    )) {

                throw new IllegalArgumentException(
                        "Question "
                        + question.getQuestionId()
                        + " does not belong to section "
                        + section.getSectionId()
                        + "."
                );
            }

            boolean hasHistoricalAnswers
                    = answerRepository
                            .existsByQuestionQuestionId(
                                    question.getQuestionId()
                            );

            if (hasHistoricalAnswers) {

                /*
             * Delete/deactivate is still allowed.
             *
             * If active=false, preserve the old text/type/options
             * exactly so historical applications keep their meaning.
                 */
                if (request.active()) {

                    if (builderQuestionDefinitionChanged(
                            question,
                            request
                    )) {

                        throw new IllegalArgumentException(
                                "Question \""
                                + question.getQuestionText()
                                + "\" already has application answers. "
                                + "Deactivate it instead of editing it."
                        );
                    }
                }

            } else {

                /*
             * No historical answers, so editing is safe.
                 */
                applyQuestion(
                        question,
                        new SaveQuestionRequest(
                                request.questionText(),
                                request.questionType(),
                                request.required(),
                                request.options()
                        )
                );

                applyQuestionOptions(
                        question,
                        request.options()
                );
            }

            question.setActive(
                    request.active()
            );

            question.setOrderNum(
                    orderNum++
            );

            questionRepository.save(
                    question
            );
        }


        /*
     * If an existing question disappeared completely from
     * the draft payload, treat that as a soft delete.
         */
        for (ApplicationQuestion existingQuestion
                : existingQuestions) {

            if (existingQuestion.getQuestionId() != null
                    && !requestedExistingQuestionIds.contains(
                            existingQuestion.getQuestionId()
                    )) {

                existingQuestion.setActive(false);

                questionRepository.save(
                        existingQuestion
                );
            }
        }
    }

    private void syncBuilderRoleSections(
            ApplicationRole role,
            List<Long> sectionClientIds,
            Map<Long, ApplicationSection> sectionsByClientId
    ) {

        if (sectionClientIds == null
                || sectionClientIds.isEmpty()) {

            throw new IllegalArgumentException(
                    role.getName()
                    + " must have at least one application section."
            );
        }

        List<ApplicationSection> desiredSections
                = new ArrayList<>();

        Set<Long> seenClientIds
                = new HashSet<>();

        for (Long clientId : sectionClientIds) {

            if (!seenClientIds.add(clientId)) {

                throw new IllegalArgumentException(
                        "The same section cannot appear twice for "
                        + role.getName()
                        + "."
                );
            }

            ApplicationSection section
                    = sectionsByClientId.get(clientId);

            if (section == null) {

                throw new IllegalArgumentException(
                        "Unknown section client ID: "
                        + clientId
                );
            }

            desiredSections.add(section);
        }


        /*
     * GTKY must always be Step 1.
         */
        if (desiredSections.isEmpty()
                || !isGetToKnowYou(
                        desiredSections.get(0)
                )) {

            throw new IllegalArgumentException(
                    role.getName()
                    + " must have Get to Know You as its first section."
            );
        }

        List<ApplicationSectionRole> existing
                = sectionRoleRepository
                        .findByApplicationRoleApplicationRoleIdOrderByDisplayOrderAsc(
                                role.getApplicationRoleId()
                        );


        /*
     * Temporarily move existing relationships away from
     * display_order 1,2,3,...
     *
     * This avoids unique-constraint collisions while
     * reordering sections.
         */
        int temporaryOrder
                = existing.stream()
                        .mapToInt(
                                ApplicationSectionRole::getDisplayOrder
                        )
                        .max()
                        .orElse(0)
                + desiredSections.size()
                + 100;

        for (ApplicationSectionRole relation
                : existing) {

            relation.setDisplayOrder(
                    temporaryOrder++
            );
        }

        sectionRoleRepository.saveAll(
                existing
        );

        sectionRoleRepository.flush();

        Set<Long> desiredSectionIds
                = desiredSections
                        .stream()
                        .map(
                                ApplicationSection::getSectionId
                        )
                        .collect(Collectors.toSet());

        List<ApplicationSectionRole> toRemove
                = existing.stream()
                        .filter(
                                relation
                                -> !desiredSectionIds.contains(
                                        relation
                                                .getSection()
                                                .getSectionId()
                                )
                        )
                        .toList();

        sectionRoleRepository.deleteAll(
                toRemove
        );

        sectionRoleRepository.flush();

        Map<Long, ApplicationSectionRole> existingBySectionId
                = existing.stream()
                        .filter(
                                relation
                                -> desiredSectionIds.contains(
                                        relation
                                                .getSection()
                                                .getSectionId()
                                )
                        )
                        .collect(
                                Collectors.toMap(
                                        relation
                                        -> relation
                                                .getSection()
                                                .getSectionId(),
                                        Function.identity()
                                )
                        );

        List<ApplicationSectionRole> finalRelations
                = new ArrayList<>();

        int displayOrder = 1;

        for (ApplicationSection section
                : desiredSections) {

            ApplicationSectionRole relation
                    = existingBySectionId.get(
                            section.getSectionId()
                    );

            if (relation == null) {

                relation
                        = new ApplicationSectionRole();

                relation.setApplicationRole(
                        role
                );

                relation.setSection(
                        section
                );
            }

            relation.setDisplayOrder(
                    displayOrder++
            );

            finalRelations.add(
                    relation
            );
        }

        sectionRoleRepository.saveAll(
                finalRelations
        );
    }

    private String normalizeBuilderQuestionType(
            String value
    ) {

        String type
                = value
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (!QUESTION_TYPES.contains(type)) {

            throw new IllegalArgumentException(
                    "Unsupported question type: "
                    + type
            );
        }

        return type;
    }

    private boolean builderQuestionDefinitionChanged(
            ApplicationQuestion question,
            BuilderQuestionRequest request
    ) {

        String requestedType
                = normalizeBuilderQuestionType(
                        request.questionType()
                );

        List<String> requestedOptions
                = normalizeBuilderQuestionOptions(
                        requestedType,
                        request.options()
                );

        List<String> existingOptions
                = question.getOptions()
                        .stream()
                        .map(
                                option
                                -> option
                                        .getOptionText()
                                        .trim()
                        )
                        .toList();

        return !question
                .getQuestionText()
                .equals(
                        request
                                .questionText()
                                .trim()
                )
                || !question
                        .getQuestionType()
                        .equals(
                                requestedType
                        )
                || question.isRequired()
                != request.required()
                || !existingOptions.equals(
                        requestedOptions
                );
    }

    private List<String> normalizeBuilderQuestionOptions(
            String questionType,
            List<String> requestedOptions
    ) {

        List<String> options
                = requestedOptions == null
                        ? List.of()
                        : requestedOptions
                                .stream()
                                .map(
                                        option
                                        -> option == null
                                                ? ""
                                                : option.trim()
                                )
                                .filter(
                                        option
                                        -> !option.isBlank()
                                )
                                .toList();

        boolean choiceQuestion
                = CHOICE_TYPES.contains(
                        questionType
                );

        if (!choiceQuestion) {

            if (!options.isEmpty()) {

                throw new IllegalArgumentException(
                        "Only single-choice and multiple-choice questions can have options."
                );
            }

            return List.of();
        }

        if (options.isEmpty()) {

            throw new IllegalArgumentException(
                    "Choice questions must have at least one option."
            );
        }

        Set<String> unique
                = options.stream()
                        .map(
                                option
                                -> option.toLowerCase(
                                        Locale.ROOT
                                )
                        )
                        .collect(
                                Collectors.toSet()
                        );

        if (unique.size() != options.size()) {

            throw new IllegalArgumentException(
                    "A question cannot contain duplicate options."
            );
        }

        return options;
    }

    private void validateBuilderRoleNames(
            List<BuilderRoleRequest> roles
    ) {

        Set<String> names
                = new HashSet<>();

        for (BuilderRoleRequest role : roles) {

            String normalized
                    = role.name()
                            .trim()
                            .toLowerCase(
                                    Locale.ROOT
                            );

            if (!names.add(normalized)) {

                throw new IllegalArgumentException(
                        "Officer role names must be unique."
                );
            }
        }
    }

    private void validateBuilderRoleIds(
            List<BuilderRoleRequest> roles
    ) {

        Set<Long> ids
                = new HashSet<>();

        for (BuilderRoleRequest role : roles) {

            if (role.applicationRoleId() == null) {
                continue;
            }

            if (!ids.add(role.applicationRoleId())) {

                throw new IllegalArgumentException(
                        "The same officer role cannot appear more than once."
                );
            }
        }
    }

    private void validateBuilderSectionIds(
            List<BuilderSectionRequest> sections
    ) {

        Set<Long> clientIds
                = new HashSet<>();

        Set<Long> databaseIds
                = new HashSet<>();

        for (BuilderSectionRequest section
                : sections) {

            if (!clientIds.add(section.clientId())) {

                throw new IllegalArgumentException(
                        "Section client IDs must be unique."
                );
            }

            if (section.sectionId() != null
                    && !databaseIds.add(
                            section.sectionId()
                    )) {

                throw new IllegalArgumentException(
                        "The same database section cannot appear more than once."
                );
            }
        }
    }
}
