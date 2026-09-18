package com.vsa.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vsa.dto.request.SaveQuestionRequest;
import com.vsa.model.ApplicationQuestion;
import com.vsa.model.ApplicationQuestionOption;
import com.vsa.repository.ApplicationAnswerRepository;
import com.vsa.repository.ApplicationQuestionRepository;
import com.vsa.repository.ApplicationRecruitmentSettingsRepository;
import com.vsa.repository.ApplicationRoleRepository;
import com.vsa.repository.ApplicationSectionRepository;
import com.vsa.repository.ApplicationSectionRoleRepository;
import com.vsa.repository.OfficerApplicationRepository;
import com.vsa.repository.UserRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

  @Mock private ApplicationRecruitmentSettingsRepository recruitmentSettingsRepository;
  @Mock private ApplicationRoleRepository roleRepository;
  @Mock private ApplicationSectionRepository sectionRepository;
  @Mock private ApplicationSectionRoleRepository sectionRoleRepository;
  @Mock private ApplicationQuestionRepository questionRepository;
  @Mock private OfficerApplicationRepository officerApplicationRepository;
  @Mock private ApplicationAnswerRepository answerRepository;
  @Mock private UserRepository userRepository;

  private ApplicationService applicationService;

  private ApplicationQuestion question;

  @BeforeEach
  void setup() {
    applicationService =
        new ApplicationService(
            recruitmentSettingsRepository,
            roleRepository,
            sectionRepository,
            sectionRoleRepository,
            questionRepository,
            officerApplicationRepository,
            answerRepository,
            userRepository);

    question = new ApplicationQuestion();
    question.setQuestionId(1L);
    question.setQuestionText("Why do you want to join?");
    question.setQuestionType("single_choice");
    question.setRequired(true);
    question.setActive(true);
  }

  private ApplicationQuestionOption existingOption(
      Long optionId, String text, int displayOrder) {
    ApplicationQuestionOption option = new ApplicationQuestionOption();
    option.setOptionId(optionId);
    option.setQuestion(question);
    option.setOptionText(text);
    option.setDisplayOrder(displayOrder);
    return option;
  }

  private void stubUpdateHappyPath() {
    when(questionRepository.findById(question.getQuestionId())).thenReturn(java.util.Optional.of(question));
    when(answerRepository.existsByQuestionQuestionId(question.getQuestionId())).thenReturn(false);
    when(questionRepository.save(any(ApplicationQuestion.class))).thenAnswer(invocation -> invocation.getArgument(0));
  }

  @Test
  void updateQuestion_sameOptionCount_reusesExistingOptionInstances() {
    ApplicationQuestionOption optionA = existingOption(10L, "A", 1);
    ApplicationQuestionOption optionB = existingOption(11L, "B", 2);
    question.setOptions(new java.util.ArrayList<>(List.of(optionA, optionB)));

    stubUpdateHappyPath();

    applicationService.updateQuestion(
        question.getQuestionId(),
        new SaveQuestionRequest(
            "Why do you want to join?", "single_choice", true, List.of("A2", "B2")));

    List<ApplicationQuestionOption> result = question.getOptions();
    assertEquals(2, result.size());
    assertSame(optionA, result.get(0));
    assertSame(optionB, result.get(1));
    assertEquals("A2", result.get(0).getOptionText());
    assertEquals("B2", result.get(1).getOptionText());
    assertEquals(1, result.get(0).getDisplayOrder());
    assertEquals(2, result.get(1).getDisplayOrder());
  }

  @Test
  void updateQuestion_growingOptionCount_appendsNewOptionAndKeepsExistingOnes() {
    ApplicationQuestionOption optionA = existingOption(10L, "A", 1);
    ApplicationQuestionOption optionB = existingOption(11L, "B", 2);
    question.setOptions(new java.util.ArrayList<>(List.of(optionA, optionB)));

    stubUpdateHappyPath();

    applicationService.updateQuestion(
        question.getQuestionId(),
        new SaveQuestionRequest(
            "Why do you want to join?", "single_choice", true, List.of("A", "B", "C")));

    List<ApplicationQuestionOption> result = question.getOptions();
    assertEquals(3, result.size());
    assertSame(optionA, result.get(0));
    assertSame(optionB, result.get(1));

    ApplicationQuestionOption newOption = result.get(2);
    assertEquals("C", newOption.getOptionText());
    assertEquals(3, newOption.getDisplayOrder());
    assertSame(question, newOption.getQuestion());
  }

  @Test
  void updateQuestion_shrinkingOptionCount_removesTrailingOptions() {
    ApplicationQuestionOption optionA = existingOption(10L, "A", 1);
    ApplicationQuestionOption optionB = existingOption(11L, "B", 2);
    ApplicationQuestionOption optionC = existingOption(12L, "C", 3);
    question.setOptions(new java.util.ArrayList<>(List.of(optionA, optionB, optionC)));

    stubUpdateHappyPath();

    applicationService.updateQuestion(
        question.getQuestionId(),
        new SaveQuestionRequest("Why do you want to join?", "single_choice", true, List.of("A")));

    List<ApplicationQuestionOption> result = question.getOptions();
    assertEquals(1, result.size());
    assertSame(optionA, result.get(0));
    assertFalse(result.contains(optionB));
    assertFalse(result.contains(optionC));
  }

  @Test
  void updateQuestion_duplicateOptions_throws() {
    question.setOptions(new java.util.ArrayList<>());

    when(questionRepository.findById(question.getQuestionId())).thenReturn(java.util.Optional.of(question));
    when(answerRepository.existsByQuestionQuestionId(question.getQuestionId())).thenReturn(false);

    assertThrows(
        IllegalArgumentException.class,
        () ->
            applicationService.updateQuestion(
                question.getQuestionId(),
                new SaveQuestionRequest(
                    "Why do you want to join?", "single_choice", true, List.of("A", "A"))));
  }

  @Test
  void updateQuestion_nonChoiceQuestionWithOptions_throws() {
    question.setQuestionType("short_text");
    question.setOptions(new java.util.ArrayList<>());

    when(questionRepository.findById(question.getQuestionId())).thenReturn(java.util.Optional.of(question));
    when(answerRepository.existsByQuestionQuestionId(question.getQuestionId())).thenReturn(false);

    assertThrows(
        IllegalArgumentException.class,
        () ->
            applicationService.updateQuestion(
                question.getQuestionId(),
                new SaveQuestionRequest("Describe yourself", "short_text", true, List.of("A"))));
  }

  @Test
  void updateQuestion_nonChoiceQuestion_clearsExistingOptions() {
    question.setQuestionType("short_text");
    ApplicationQuestionOption stale = existingOption(10L, "stale", 1);
    question.setOptions(new java.util.ArrayList<>(List.of(stale)));

    stubUpdateHappyPath();

    applicationService.updateQuestion(
        question.getQuestionId(),
        new SaveQuestionRequest("Describe yourself", "short_text", true, List.of()));

    assertTrue(question.getOptions().isEmpty());
  }
}
