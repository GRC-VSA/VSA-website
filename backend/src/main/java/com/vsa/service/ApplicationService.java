package com.vsa.service;

import com.vsa.controller.ApplicationDtos.*;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.*;
import com.vsa.repository.ApplicantRepository;
import com.vsa.repository.ApplicationQuestionRepository;
import com.vsa.repository.ApplicationRoleRepository;
import com.vsa.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class ApplicationService {
  private final ApplicationRoleRepository roleRepository;
  private final ApplicationQuestionRepository questionRepository;
  private final ApplicantRepository applicantRepository;
  private final UserRepository userRepository;
  private final EmailService emailService;

  public ApplicationService(
      ApplicationRoleRepository roleRepository,
      ApplicationQuestionRepository questionRepository,
      ApplicantRepository applicantRepository,
      UserRepository userRepository,
      EmailService emailService) {
    this.roleRepository = roleRepository;
    this.questionRepository = questionRepository;
    this.applicantRepository = applicantRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  public List<RoleResponse> getAllRoles() {
    return roleRepository.findAllByOrderByCreatedAtAsc().stream().map(this::toRoleResponse).toList();
  }

  public List<RoleResponse> getOpenRoles() {
    return roleRepository
        .findByRecruitingTrueAndStatusOrderByCreatedAtAsc(ApplicationRoleStatus.FINISHED)
        .stream()
        .map(this::toRoleResponse)
        .toList();
  }

  public RoleResponse getRole(Long roleId) {
    return toRoleResponse(requireRole(roleId));
  }

  public RoleResponse saveRole(Long roleId, SaveRoleRequest request) {
    ApplicationRole role = roleId == null ? new ApplicationRole() : requireRole(roleId);
    if (roleId != null) {
      ensureRoleMutable(role);
    }
    String name = request.name().trim();
    boolean nameChanged = role.getName() == null || !role.getName().equalsIgnoreCase(name);
    if (nameChanged && roleRepository.existsByNameIgnoreCase(name)) {
      throw new IllegalArgumentException("An application role with this name already exists");
    }

    role.setName(name);
    role.setDescription(trimToNull(request.description()));
    role.setRecruiting(request.recruiting());
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    role.getSections().clear();

    int sectionNumber = 1;
    for (SectionRequest sectionRequest :
        request.sections() == null ? List.<SectionRequest>of() : request.sections()) {
      ApplicationSection section = new ApplicationSection();
      section.setSectionHeading(sectionRequest.sectionHeading().trim());
      section.setSectionDescription(trimToNull(sectionRequest.sectionDescription()));
      section.setSectionNumber(sectionNumber++);
      section.setApplicationRole(role);

      int questionNumber = 1;
      for (QuestionRequest questionRequest : sectionRequest.questions()) {
        ApplicationQuestion question = new ApplicationQuestion();
        question.setPrompt(questionRequest.prompt().trim());
        question.setRequired(questionRequest.required());
        question.setResponseType(questionRequest.responseType());
        question.setQuestionNumber(questionNumber++);
        question.setSection(section);
        section.getQuestions().add(question);
      }
      role.getSections().add(section);
    }
    return toRoleResponse(roleRepository.save(role));
  }

  public void deleteRole(Long roleId) {
    ApplicationRole role = requireRole(roleId);
    ensureRoleMutable(role);
    roleRepository.delete(role);
  }

  public SectionResponse getSection(Long sectionId) {
    return toSectionResponse(requireSection(sectionId));
  }

  public SectionResponse createSection(Long roleId, SaveSectionRequest request) {
    ApplicationRole role = requireRole(roleId);
    ensureRoleMutable(role);
    ApplicationSection section = new ApplicationSection();
    section.setSectionHeading(request.sectionHeading().trim());
    section.setSectionDescription(trimToNull(request.sectionDescription()));
    section.setSectionNumber(role.getSections().size() + 1);
    section.setApplicationRole(role);
    role.getSections().add(section);
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    roleRepository.save(role);
    return toSectionResponse(section);
  }

  public SectionResponse updateSection(Long sectionId, SaveSectionRequest request) {
    ApplicationSection section = requireSection(sectionId);
    ApplicationRole role = section.getApplicationRole();
    ensureRoleMutable(role);
    section.setSectionHeading(request.sectionHeading().trim());
    section.setSectionDescription(trimToNull(request.sectionDescription()));
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    roleRepository.save(role);
    return toSectionResponse(section);
  }

  public void deleteSection(Long sectionId) {
    ApplicationSection section = requireSection(sectionId);
    ApplicationRole role = section.getApplicationRole();
    ensureRoleMutable(role);
    role.getSections().remove(section);
    renumberSections(role);
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    roleRepository.save(role);
  }

  public QuestionResponse getQuestion(Long questionId) {
    return toQuestionResponse(requireQuestion(questionId));
  }

  public QuestionResponse createQuestion(Long sectionId, SaveQuestionRequest request) {
    ApplicationSection section = requireSection(sectionId);
    ApplicationRole role = section.getApplicationRole();
    ensureRoleMutable(role);
    ApplicationQuestion question = new ApplicationQuestion();
    applyQuestion(question, request);
    question.setQuestionNumber(section.getQuestions().size() + 1);
    question.setSection(section);
    section.getQuestions().add(question);
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    roleRepository.save(role);
    return toQuestionResponse(question);
  }

  public QuestionResponse updateQuestion(Long questionId, SaveQuestionRequest request) {
    ApplicationQuestion question = requireQuestion(questionId);
    ApplicationRole role = question.getSection().getApplicationRole();
    ensureRoleMutable(role);
    applyQuestion(question, request);
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    questionRepository.save(question);
    return toQuestionResponse(question);
  }

  public void deleteQuestion(Long questionId) {
    ApplicationQuestion question = requireQuestion(questionId);
    ApplicationSection section = question.getSection();
    ApplicationRole role = section.getApplicationRole();
    ensureRoleMutable(role);
    section.getQuestions().remove(question);
    renumberQuestions(section);
    role.setStatus(ApplicationRoleStatus.UNFINISHED);
    roleRepository.save(role);
  }

  public List<RoleResponse> publishRecruitment() {
    List<ApplicationRole> roles = roleRepository.findAllByOrderByCreatedAtAsc();
    List<ApplicationRole> recruitingRoles = roles.stream().filter(ApplicationRole::isRecruiting).toList();
    if (recruitingRoles.isEmpty()) {
      throw new IllegalArgumentException("At least one role must be marked as recruiting");
    }
    for (ApplicationRole role : recruitingRoles) {
      if (role.getSections().isEmpty()) {
        throw new IllegalArgumentException(
            role.getName() + " must have at least one section before recruitment is published");
      }
      if (role.getSections().stream().anyMatch(section -> section.getQuestions().isEmpty())) {
        throw new IllegalArgumentException(
            role.getName() + " cannot contain a section without questions");
      }
      role.setStatus(ApplicationRoleStatus.FINISHED);
    }
    return roleRepository.saveAll(recruitingRoles).stream().map(this::toRoleResponse).toList();
  }

  public List<SubmittedApplicationResponse> submitApplications(
      String email, SubmitApplicationsRequest request) {
    User user = requireUser(email);
    ensureDistinct(
        request.applications().stream().map(RoleApplicationRequest::applicationRoleId).toList(),
        "A role can only be submitted once per request");

    List<Applicant> applicants = new ArrayList<>();
    for (RoleApplicationRequest roleRequest : request.applications()) {
      ApplicationRole role = requireRole(roleRequest.applicationRoleId());
      ensureOpen(role);
      if (applicantRepository.existsByUserEmailAndApplicationRoleApplicationRoleId(
          email, role.getApplicationRoleId())) {
        throw new IllegalArgumentException("You have already applied for " + role.getName());
      }

      Applicant applicant = new Applicant();
      applicant.setUser(user);
      applicant.setApplicationRole(role);
      applyProfile(
          applicant,
          request.preferredName(),
          request.pronouns(),
          request.phone(),
          request.academicProgram(),
          request.yearOfStudy());
      replaceAnswers(applicant, roleRequest.answers());
      applicants.add(applicant);
    }

    if (request.phone() != null && !request.phone().isBlank()) {
      user.setPhone(request.phone().trim());
      userRepository.save(user);
    }
    List<Applicant> saved = applicantRepository.saveAll(applicants);
    saved.forEach(
        applicant ->
            emailService.sendOfficerApplicationEmail(
                user.getEmail(), user.getFirstName(), applicant.getApplicationRole().getName()));
    return saved.stream().map(this::toApplicationResponse).toList();
  }

  public List<SubmittedApplicationResponse> getMyApplications(String email) {
    return applicantRepository.findByUserEmailOrderBySubmittedAtDesc(email).stream()
        .map(this::toApplicationResponse)
        .toList();
  }

  public SubmittedApplicationResponse getMyApplication(String email, Long applicantId) {
    return toApplicationResponse(requireOwnedApplication(email, applicantId));
  }

  public SubmittedApplicationResponse updateMyApplication(
      String email, Long applicantId, UpdateApplicationRequest request) {
    Applicant applicant = requireOwnedApplication(email, applicantId);
    if (applicant.getStatus() != ApplicantStatus.SUBMITTED) {
      throw new IllegalArgumentException("Only submitted applications can be edited");
    }
    applyProfile(
        applicant,
        request.preferredName(),
        request.pronouns(),
        request.phone(),
        request.academicProgram(),
        request.yearOfStudy());
    replaceAnswers(applicant, request.answers());
    if (request.phone() != null && !request.phone().isBlank()) {
      applicant.getUser().setPhone(request.phone().trim());
      userRepository.save(applicant.getUser());
    }
    return toApplicationResponse(applicantRepository.save(applicant));
  }

  public void deleteMyApplication(String email, Long applicantId) {
    Applicant applicant = requireOwnedApplication(email, applicantId);
    if (applicant.getStatus() != ApplicantStatus.SUBMITTED) {
      throw new IllegalArgumentException("Only submitted applications can be withdrawn");
    }
    applicantRepository.delete(applicant);
  }

  public List<SubmittedApplicationResponse> getAllApplications(ApplicantStatus status) {
    List<Applicant> applicants =
        status == null
            ? applicantRepository.findAllByOrderBySubmittedAtDesc()
            : applicantRepository.findByStatusOrderBySubmittedAtDesc(status);
    return applicants.stream().map(this::toApplicationResponse).toList();
  }

  public SubmittedApplicationResponse getApplication(Long applicantId) {
    return toApplicationResponse(requireApplication(applicantId));
  }

  public SubmittedApplicationResponse updateStatus(Long applicantId, ApplicantStatus status) {
    Applicant applicant = requireApplication(applicantId);
    applicant.setStatus(status);
    return toApplicationResponse(applicantRepository.save(applicant));
  }

  public void deleteApplication(Long applicantId) {
    applicantRepository.delete(requireApplication(applicantId));
  }

  private void replaceAnswers(Applicant applicant, List<AnswerRequest> answerRequests) {
    ApplicationRole role = applicant.getApplicationRole();
    Map<Long, ApplicationQuestion> questions =
        role.getSections().stream()
            .flatMap(section -> section.getQuestions().stream())
            .filter(question -> question.getQuestionId() != null)
            .collect(Collectors.toMap(ApplicationQuestion::getQuestionId, Function.identity()));

    ensureDistinct(
        answerRequests.stream().map(AnswerRequest::questionId).toList(),
        "A question can only be answered once");
    Map<Long, String> supplied =
        answerRequests.stream()
            .collect(Collectors.toMap(AnswerRequest::questionId, answer -> answer.answer().trim()));
    for (Long questionId : supplied.keySet()) {
      if (!questions.containsKey(questionId)) {
        throw new IllegalArgumentException(
            "Question " + questionId + " does not belong to " + role.getName());
      }
    }
    for (ApplicationQuestion question : questions.values()) {
      if (question.isRequired()
          && (!supplied.containsKey(question.getQuestionId())
              || supplied.get(question.getQuestionId()).isBlank())) {
        throw new IllegalArgumentException("Required question was not answered: " + question.getPrompt());
      }
    }

    applicant.getAnswers().clear();
    for (AnswerRequest request : answerRequests) {
      ApplicationQuestion question = questions.get(request.questionId());
      String answerText = request.answer().trim();
      if (question.getResponseType() == QuestionResponseType.SHORT_TEXT
          && answerText.length() > 500) {
        throw new IllegalArgumentException(
            "Answer must be 500 characters or fewer: " + question.getPrompt());
      }
      ApplicationAnswer answer = new ApplicationAnswer();
      answer.setApplicant(applicant);
      answer.setQuestion(question);
      answer.setAnswerText(answerText);
      applicant.getAnswers().add(answer);
    }
  }

  private void applyProfile(
      Applicant applicant,
      String preferredName,
      String pronouns,
      String phone,
      String academicProgram,
      String yearOfStudy) {
    applicant.setPreferredName(trimToNull(preferredName));
    applicant.setPronouns(trimToNull(pronouns));
    applicant.setPhone(trimToNull(phone));
    applicant.setAcademicProgram(academicProgram.trim());
    applicant.setYearOfStudy(yearOfStudy.trim());
  }

  private void ensureOpen(ApplicationRole role) {
    if (!role.isRecruiting() || role.getStatus() != ApplicationRoleStatus.FINISHED) {
      throw new IllegalArgumentException(role.getName() + " is not accepting applications");
    }
  }

  private void ensureRoleMutable(ApplicationRole role) {
    if (role.getApplicationRoleId() != null
        && applicantRepository.existsByApplicationRoleApplicationRoleId(
            role.getApplicationRoleId())) {
      throw new IllegalArgumentException(
          "A role cannot be changed after applications have been submitted for it");
    }
  }

  private void applyQuestion(ApplicationQuestion question, SaveQuestionRequest request) {
    question.setPrompt(request.prompt().trim());
    question.setRequired(request.required());
    question.setResponseType(request.responseType());
  }

  private void renumberSections(ApplicationRole role) {
    for (int index = 0; index < role.getSections().size(); index++) {
      role.getSections().get(index).setSectionNumber(index + 1);
    }
  }

  private void renumberQuestions(ApplicationSection section) {
    for (int index = 0; index < section.getQuestions().size(); index++) {
      section.getQuestions().get(index).setQuestionNumber(index + 1);
    }
  }

  private <T> void ensureDistinct(List<T> values, String message) {
    if (new HashSet<>(values).size() != values.size()) {
      throw new IllegalArgumentException(message);
    }
  }

  private ApplicationRole requireRole(Long roleId) {
    return roleRepository
        .findById(roleId)
        .orElseThrow(() -> new ResourceNotFoundException("Application role", roleId));
  }

  private User requireUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
  }

  private ApplicationSection requireSection(Long sectionId) {
    ApplicationRole role =
        roleRepository
            .findBySectionsSectionId(sectionId)
            .orElseThrow(() -> new ResourceNotFoundException("Application section", sectionId));
    return role.getSections().stream()
        .filter(section -> Objects.equals(section.getSectionId(), sectionId))
        .findFirst()
        .orElseThrow(() -> new ResourceNotFoundException("Application section", sectionId));
  }

  private ApplicationQuestion requireQuestion(Long questionId) {
    return questionRepository
        .findById(questionId)
        .orElseThrow(() -> new ResourceNotFoundException("Application question", questionId));
  }

  private Applicant requireOwnedApplication(String email, Long applicantId) {
    return applicantRepository
        .findByApplicantIdAndUserEmail(applicantId, email)
        .orElseThrow(() -> new ResourceNotFoundException("Application", applicantId));
  }

  private Applicant requireApplication(Long applicantId) {
    return applicantRepository
        .findById(applicantId)
        .orElseThrow(() -> new ResourceNotFoundException("Application", applicantId));
  }

  private RoleResponse toRoleResponse(ApplicationRole role) {
    List<SectionResponse> sections =
        role.getSections().stream().map(this::toSectionResponse).toList();
    return new RoleResponse(
        role.getApplicationRoleId(),
        role.getName(),
        role.getDescription(),
        role.isRecruiting(),
        role.getStatus(),
        sections,
        role.getCreatedAt(),
        role.getUpdatedAt());
  }

  private SectionResponse toSectionResponse(ApplicationSection section) {
    return new SectionResponse(
        section.getSectionId(),
        section.getSectionNumber(),
        section.getSectionHeading(),
        section.getSectionDescription(),
        section.getQuestions().stream().map(this::toQuestionResponse).toList());
  }

  private QuestionResponse toQuestionResponse(ApplicationQuestion question) {
    return new QuestionResponse(
        question.getQuestionId(),
        question.getQuestionNumber(),
        question.getPrompt(),
        question.isRequired(),
        question.getResponseType());
  }

  private SubmittedApplicationResponse toApplicationResponse(Applicant applicant) {
    User user = applicant.getUser();
    return new SubmittedApplicationResponse(
        applicant.getApplicantId(),
        applicant.getApplicationRole().getApplicationRoleId(),
        applicant.getApplicationRole().getName(),
        user.getSid(),
        user.getFirstName(),
        user.getLastName(),
        user.getEmail(),
        applicant.getPreferredName(),
        applicant.getPronouns(),
        applicant.getPhone(),
        applicant.getAcademicProgram(),
        applicant.getYearOfStudy(),
        applicant.getStatus(),
        applicant.getAnswers().stream()
            .map(
                answer ->
                    new AnswerResponse(
                        answer.getQuestion().getQuestionId(),
                        answer.getQuestion().getPrompt(),
                        answer.getAnswerText()))
            .toList(),
        applicant.getSubmittedAt(),
        applicant.getUpdatedAt());
  }

  private String trimToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
