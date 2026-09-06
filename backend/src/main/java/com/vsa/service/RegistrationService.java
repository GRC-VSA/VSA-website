    package com.vsa.service;

    import com.vsa.dto.request.AnswerRequest;
    import com.vsa.dto.request.RegistrationRequest;
    import com.vsa.dto.request.RegistrationResendRequest;
    import com.vsa.dto.request.RegistrationVerificationRequest;
    import com.vsa.dto.response.QuestionOptionResponse;
    import com.vsa.dto.response.RegistrationFormResponse;
    import com.vsa.dto.response.RegistrationQuestionResponse;
    import com.vsa.dto.response.RegistrationStartResponse;
    import com.vsa.exception.ResourceNotFoundException;
    import com.vsa.model.*;
    import com.vsa.repository.QuestionRepository;
    import com.vsa.repository.RegistrationRepository;
    import jakarta.transaction.Transactional;
    import org.springframework.stereotype.Service;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

    import java.security.SecureRandom;
    import java.time.LocalDateTime;
    import java.time.format.DateTimeFormatter;
    import java.util.List;
    import java.util.stream.Collectors;
    import java.util.Locale;
    import java.util.Optional;
    import java.util.UUID;

    @Service
    public class RegistrationService {
        private static final DateTimeFormatter DATE_FORMATTER =
                DateTimeFormatter.ofPattern("MMMM d, yyyy");
        private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

        private final RegistrationRepository registrationRepository;
        private final QuestionRepository questionRepository;
        private final EventService eventService;
        private final EmailService emailService;
        private final BCryptPasswordEncoder passwordEncoder;

        private static final String STUDENT_EMAIL_SYSTEM_KEY = "STUDENT_EMAIL";
        private static final String STATUS_PENDING = "pending_email_verification";
        private static final String STATUS_CONFIRMED = "confirmed";

        private static final int VERIFICATION_CODE_LENGTH = 8;
        private static final int VERIFICATION_EXPIRATION_MINUTES = 10;
        private static final int VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;


        private static final String VERIFICATION_CHARACTERS ="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        private static final SecureRandom SECURE_RANDOM = new SecureRandom();


        public RegistrationService(
                RegistrationRepository registrationRepository,
                QuestionRepository questionRepository,
                EventService eventService,
                EmailService emailService,
                BCryptPasswordEncoder passwordEncoder) {
            this.registrationRepository = registrationRepository;
            this.questionRepository = questionRepository;
            this.eventService = eventService;
            this.emailService = emailService;
            this.passwordEncoder = passwordEncoder;

        }


        //Read
        public List<Registration> getRegistrationsForEvent(Long eventId){
            eventService.getEventById(eventId);
            return registrationRepository.findByEvent_EventId(eventId);
    }

        //Create
        @Transactional
        public RegistrationStartResponse register(Long eventId, RegistrationRequest req) {
            Event event = eventService.getEventById(eventId);

            if (!"INTERNAL".equals(event.getRegistrationType())) {
                throw new IllegalStateException("This event does not use internal registration.");
            }

            // Get all active questions for this event
            List<Question> questions = questionRepository.findByEvent_EventIdAndIsActiveTrueOrderByDisplayOrderAsc(eventId);

            // Make sure all required questions were answered
            validateRequiredAnswers(questions, req);

            // Find the answer to the special STUDENT_EMAIL question
            String studentEmail = extractStudentEmail(questions, req).trim().toLowerCase(Locale.ROOT);

            validateStudentEmail(studentEmail);

            // Check whether this email already has a registration
            Optional<Registration> existingRegistration =
                registrationRepository
                        .findByEvent_EventIdAndStudentEmailIgnoreCase(eventId, studentEmail);

            // If already confirmed, don't allow another registration
            if (existingRegistration.isPresent() && STATUS_CONFIRMED.equals(existingRegistration.get().getStatus())) {
                throw new IllegalStateException("This student email is already registered for this event.");
            }

            // Only CONFIRMED registrations count toward capacity
            long confirmedCount =
                registrationRepository
                        .countByEvent_EventIdAndStatus(
                                eventId,
                                STATUS_CONFIRMED
                        );

            if (confirmedCount >= event.getCapacity()) {
                throw new IllegalStateException("This event is at capacity.");}

            // Generate a new 8-character verification code
            String verificationCode = generateVerificationCode();

            /*
            * If this email already submitted the form but never verified,
            * reuse that pending registration instead of creating another row.
            */
            Registration registration = existingRegistration.orElseGet(Registration::new);

            registration.setEvent(event);
            registration.setStudentEmail(studentEmail);
            registration.setStatus(STATUS_PENDING);

            registration.setTicketType(req.getTicketType() != null ? req.getTicketType(): "general");

            // Create a fresh verification session
            LocalDateTime now = LocalDateTime.now();
            registration.setVerificationId(UUID.randomUUID());

            // Store only the hash, never the actual code
            registration.setVerificationCodeHash(passwordEncoder.encode(verificationCode));
            registration.setVerificationCodeSentAt(now);

            registration.setVerificationExpiresAt(now.plusMinutes(VERIFICATION_EXPIRATION_MINUTES));

            registration.setVerificationAttempts(0);
            registration.setEmailVerifiedAt(null);

            /*
            * If this was an existing pending registration,
            * replace its previous answers with the newly submitted ones.
            */
            registration.getAnswers().clear();

            if (req.getAnswers() != null) {
                List<EventAnswer> answers =
                    req.getAnswers()
                            .stream()
                            .map(answerRequest ->
                                    buildAnswer(
                                            eventId,
                                            registration,
                                            answerRequest
                                    )
                            )
                            .collect(Collectors.toList());

                registration.getAnswers().addAll(answers);
            }

            Registration saved = registrationRepository.save(registration);

            // Send verification code — NOT the final confirmation email yet
            emailService.sendEventRegistrationVerificationEmail(
                    studentEmail,
                    event.getEventName(),
                    verificationCode
            );

            return new RegistrationStartResponse(
                    saved.getVerificationId(),
                    maskEmail(studentEmail),
                    saved.getVerificationExpiresAt()
            );
    }

    public void verifyRegistration(Long eventId,RegistrationVerificationRequest req) {

    if (req.getVerificationId() == null) {
        throw new IllegalStateException(
                "Verification ID is required."
        );
    }

    if (req.getCode() == null || req.getCode().isBlank()) {
        throw new IllegalStateException(
                "Verification code is required."
        );
    }

    String enteredCode =
            req.getCode()
                    .trim()
                    .toUpperCase(Locale.ROOT);

    if (!enteredCode.matches(
            "^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$"
    )) {
        throw new IllegalStateException(
                "Invalid verification code."
        );
    }

    Registration registration =
            registrationRepository
                    .findByVerificationId(
                            req.getVerificationId()
                    )
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Registration verification request was not found."
                            )
                    );

    /*
     * Make sure somebody cannot take a verification ID
     * belonging to another event and use it here.
     */
    if (!registration
            .getEvent()
            .getEventId()
            .equals(eventId)) {

        throw new IllegalStateException(
                "Invalid registration verification request."
        );
    }

    /*
     * If it was already confirmed, don't confirm/send email again.
     */
    if (STATUS_CONFIRMED.equals(registration.getStatus())) {
        return;
    }

    if (!STATUS_PENDING.equals(registration.getStatus())) {
        throw new IllegalStateException(
                "This registration cannot be verified."
        );
    }

    /*
     * Reject expired codes.
     */
    if (registration.getVerificationExpiresAt() == null
            || registration
                    .getVerificationExpiresAt()
                    .isBefore(LocalDateTime.now())) {

        throw new IllegalStateException(
                "Verification code has expired."
        );
    }

    /*
     * Prevent unlimited guessing.
     */
    if (registration.getVerificationAttempts() >= 5) {
        throw new IllegalStateException(
                "Too many incorrect verification attempts."
        );
    }

    /*
     * Compare the entered code against the BCrypt hash.
     */
    boolean codeMatches =
            passwordEncoder.matches(
                    enteredCode,
                    registration.getVerificationCodeHash()
            );

    if (!codeMatches) {

        registration.setVerificationAttempts(
                registration.getVerificationAttempts() + 1
        );

        registrationRepository.save(registration);

        throw new IllegalStateException(
                "Incorrect verification code."
        );
    }

    Event event = registration.getEvent();

    /*
     * Check capacity again here.
     *
     * The event may have filled up during the 10 minutes
     * while this user was verifying their email.
     */
    long confirmedCount =
            registrationRepository
                    .countByEvent_EventIdAndStatus(
                            eventId,
                            STATUS_CONFIRMED
                    );

    if (confirmedCount >= event.getCapacity()) {
        throw new IllegalStateException(
                "This event is now at capacity."
        );
    }

    /*
     * Verification succeeded.
     */
    registration.setStatus(STATUS_CONFIRMED);

    registration.setEmailVerifiedAt(
            LocalDateTime.now()
    );

    /*
     * The verification code is single-use.
     * We no longer need its hash or expiration.
     */
    registration.setVerificationCodeHash(null);
    registration.setVerificationExpiresAt(null);

    Registration saved =
            registrationRepository.save(registration);

    /*
     * NOW the registration is officially confirmed,
     * so send the confirmation email.
     */
    emailService.sendEventRegistrationEmail(
            saved.getStudentEmail(),
            "there",
            event.getEventName(),
            event.getEventDate().format(DATE_FORMATTER),
            event.getStartTime().format(TIME_FORMATTER),
            event.getLocation()
    );
}

        public void resendVerificationCode(
        Long eventId,
        RegistrationResendRequest req
) {
    if (req.getVerificationId() == null) {
        throw new IllegalStateException(
                "Verification ID is required."
        );
    }

    Registration registration =
            registrationRepository
                    .findByVerificationId(req.getVerificationId())
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Registration verification request was not found."
                            )
                    );

    // Make sure this verification belongs to the event in the URL
    if (!registration
            .getEvent()
            .getEventId()
            .equals(eventId)) {

        throw new IllegalStateException(
                "Invalid registration verification request."
        );
    }

    // A confirmed registration no longer needs verification codes
    if (STATUS_CONFIRMED.equals(registration.getStatus())) {
        throw new IllegalStateException(
                "This registration is already confirmed."
        );
    }

    if (!STATUS_PENDING.equals(registration.getStatus())) {
        throw new IllegalStateException(
                "This registration cannot receive a verification code."
        );
    }

    LocalDateTime now = LocalDateTime.now();

    // Prevent repeatedly requesting emails
    if (registration.getVerificationCodeSentAt() != null
            && now.isBefore(
                    registration
                            .getVerificationCodeSentAt()
                            .plusSeconds(
                                    VERIFICATION_RESEND_COOLDOWN_SECONDS
                            )
            )) {

        throw new IllegalStateException(
                "Please wait before requesting another verification code."
        );
    }

    String verificationCode =
            generateVerificationCode();

    // Replace the old code with a fresh one
    registration.setVerificationCodeHash(
            passwordEncoder.encode(verificationCode)
    );

    registration.setVerificationCodeSentAt(now);

    registration.setVerificationExpiresAt(
            now.plusMinutes(
                    VERIFICATION_EXPIRATION_MINUTES
            )
    );

    // Give the new code a fresh set of attempts
    registration.setVerificationAttempts(0);

    registrationRepository.save(registration);

    emailService.sendEventRegistrationVerificationEmail(
            registration.getStudentEmail(),
            registration.getEvent().getEventName(),
            verificationCode
    );
}

        @Transactional
        public RegistrationFormResponse getRegistrationForm(Long eventId) {

            Event event = eventService.getEventById(eventId);

            if (!"INTERNAL".equals(event.getRegistrationType())) {
                throw new IllegalStateException("This event does not use internal registration.");
            }

            List<Question> questions = questionRepository.findByEvent_EventIdAndIsActiveTrueOrderByDisplayOrderAsc(eventId);

            RegistrationFormResponse response = new RegistrationFormResponse();

            response.setEventId(event.getEventId());
            response.setEventName(event.getEventName());
            response.setImageUrl(event.getImageUrl());
            response.setEventDate(event.getEventDate());
            response.setLocation(event.getLocation());
            response.setStartTime(event.getStartTime());
            response.setEndTime(event.getEndTime());

            List<RegistrationQuestionResponse> questionResponses =
                                    questions.stream()
                                    .map(this::buildQuestionResponse)
                                    .collect(Collectors.toList());

            response.setQuestions(questionResponses);

            return response;
    }

        //Helper
        // private User getCurrentUser() {
        //     String email = SecurityContextHolder.getContext().getAuthentication().getName();
        //     return userRepository
        //             .findByEmail(email)
        //             .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
        // }

        private EventAnswer buildAnswer(Long eventId, Registration registration, AnswerRequest req) {
            Question question =
                    questionRepository
                            .findById(req.getQuestionId())
                            .orElseThrow(() -> new ResourceNotFoundException("Question", req.getQuestionId()));

            // Guard against submitting an answer for a question that belongs to a different event
            if (!question.getEvent().getEventId().equals(eventId)) {
                throw new ResourceNotFoundException("Question", req.getQuestionId());
            }

            EventAnswer answer = new EventAnswer();
            answer.setRegistration(registration);
            answer.setQuestion(question);

            String typeName = question.getQuestionType().getTypeName();
            if ("single_choice".equals(typeName)|| "multiple_choice".equals(typeName)) {
                answer.setAnswerValue(buildChoiceAnswerValue(question, req));
            } 
            else {
                answer.setAnswerValue(req.getAnswerValue());
            }

            return answer;
        }
        private String buildChoiceAnswerValue(Question question, AnswerRequest req) {
            List<Long> selectedOptionIds = req.getSelectedOptionIds();

            if (selectedOptionIds == null || selectedOptionIds.isEmpty()) {
                return "";
            }

            String typeName = question.getQuestionType().getTypeName();

            // Single choice should contain exactly one selected option
            if ("single_choice".equals(typeName) && selectedOptionIds.size() != 1) {
                throw new IllegalStateException("Single-choice question must have exactly one selected option.");
            }

            List<QuestionOption> selectedOptions =
                question.getOptions()
                    .stream()
                    .filter(option -> selectedOptionIds.contains(option.getOptionId()))
                    .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                    .collect(Collectors.toList());

            /*
            * This also prevents somebody from manually submitting
            * an optionId that doesn't belong to this question.
            */
            if (selectedOptions.size()!= selectedOptionIds.size()) {
                throw new IllegalStateException("One or more selected options are invalid.");
            }

            return selectedOptions
                .stream()
                .map(QuestionOption::getOptionText)
                .collect(Collectors.joining(", "));
        }

        private RegistrationQuestionResponse buildQuestionResponse(Question question) {

            RegistrationQuestionResponse response = new RegistrationQuestionResponse();
            response.setQuestionId(question.getQuestionId());
            response.setQuestionText(question.getQuestionText());
            response.setRequired(question.isRequired());
            response.setDisplayOrder(question.getDisplayOrder());
            response.setQuestionTypeId(question.getQuestionType().getQuestionTypeId());
            response.setTypeName(question.getQuestionType().getTypeName());

            List<QuestionOptionResponse> optionResponses =
                                question.getOptions()
                                .stream()
                                .map(this::buildOptionResponse)
                                .collect(Collectors.toList());

            response.setOptions(optionResponses);
            return response;
        }

        private QuestionOptionResponse buildOptionResponse(QuestionOption option) {

            QuestionOptionResponse response = new QuestionOptionResponse();
            response.setOptionId(option.getOptionId());
            response.setOptionText(option.getOptionText());
            response.setDisplayOrder(option.getDisplayOrder());
            return response;
        }

        private void validateRequiredAnswers(List<Question> questions, RegistrationRequest req) {
            for (Question question : questions) {

                if (!question.isRequired()) {
                    continue;
                }
                AnswerRequest answer = findAnswer(req, question.getQuestionId());

                if (!isAnswerProvided(question, answer)) {
                    throw new IllegalStateException("Required question not answered: " + question.getQuestionText());
                }
            }
        }
        private AnswerRequest findAnswer(RegistrationRequest req, Long questionId) {
            if (req.getAnswers() == null) {
                return null;
            }

            return req.getAnswers()
                .stream()
                .filter(answer ->
                        questionId.equals(answer.getQuestionId())
                )
                .findFirst()
                .orElse(null);
        }

        private boolean isAnswerProvided(Question question, AnswerRequest answer) {
            if (answer == null) {
                return false;
            }

            String typeName = question.getQuestionType().getTypeName();

            if ("single_choice".equals(typeName) || "multiple_choice".equals(typeName)) {
                return answer.getSelectedOptionIds() != null && !answer.getSelectedOptionIds().isEmpty();
            }

            return answer.getAnswerValue() != null && !answer.getAnswerValue().trim().isEmpty();
        }
        private String extractStudentEmail(List<Question> questions, RegistrationRequest req) {
            Question studentEmailQuestion = questions.stream()
                        .filter(question -> STUDENT_EMAIL_SYSTEM_KEY.equals(question.getSystemKey()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Student email question was not found."));

            AnswerRequest emailAnswer = findAnswer(req, studentEmailQuestion.getQuestionId());

            if (emailAnswer == null || emailAnswer.getAnswerValue() == null || emailAnswer.getAnswerValue().isBlank()) {
                throw new IllegalStateException("Student email is required.");
            }
            return emailAnswer.getAnswerValue();
        }
        private void validateStudentEmail(String email) {
            if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new IllegalStateException("Invalid student email address.");
            }
        }

        private String generateVerificationCode() {
            StringBuilder code = new StringBuilder(VERIFICATION_CODE_LENGTH);

            for (int i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
                int index = SECURE_RANDOM.nextInt(VERIFICATION_CHARACTERS.length());
                code.append(VERIFICATION_CHARACTERS.charAt(index));
            }
            return code.toString();
        }
        private String maskEmail(String email) {
            int atIndex = email.indexOf("@");

            if (atIndex <= 0) {
                return email;
            }

            String localPart = email.substring(0, atIndex);

            String domain = email.substring(atIndex);

            if (localPart.length() == 1) {
                return localPart.charAt(0) + "***" + domain;
            }

            return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1)+ domain;
        }

    }
