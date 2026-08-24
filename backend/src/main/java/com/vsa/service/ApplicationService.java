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
    if (roleId != null && applicantRepository.existsByApplicationRoleApplicationRoleId(roleId)) {
      throw new IllegalArgumentException(
          "A role cannot be changed after applications have been submitted for it");
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
    for (SectionRequest sectionRequest : request.sections()) {
      ApplicationSection section = new ApplicationSection();
      section.setTitle(sectionRequest.title().trim());
      section.setDescription(trimToNull(sectionRequest.description()));
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
    if (applicantRepository.existsByApplicationRoleApplicationRoleId(roleId)) {
      throw new IllegalArgumentException(
          "A role cannot be deleted after applications have been submitted for it");
    }
    roleRepository.delete(role);
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
        role.getSections().stream()
            .map(
                section ->
                    new SectionResponse(
                        section.getSectionId(),
                        section.getSectionNumber(),
                        section.getTitle(),
                        section.getDescription(),
                        section.getQuestions().stream()
                            .map(
                                question ->
                                    new QuestionResponse(
                                        question.getQuestionId(),
                                        question.getQuestionNumber(),
                                        question.getPrompt(),
                                        question.isRequired(),
                                        question.getResponseType()))
                            .toList()))
            .toList();
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
