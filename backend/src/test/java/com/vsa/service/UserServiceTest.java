package com.vsa.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.vsa.dto.request.AccountResendRequest;
import com.vsa.dto.request.AccountVerificationRequest;
import com.vsa.dto.response.AccountVerificationStartResponse;
import com.vsa.model.User;
import com.vsa.repository.UserRepository;
import com.vsa.security.JwtUtil;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    /** Mirrors UserService.VERIFICATION_CODE_PATTERN, which is private. */
    private static final String CODE_PATTERN = "^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$";

    @Mock private UserRepository userRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;
    @Mock private EmailOutboxService emailOutboxService;

    @InjectMocks private UserService userService;

    // ── Registration ───────────────────────────────────────────

    @Test
    void registerUser_Success() {
        User user = newRegistration("new@vsa.com");

        when(userRepository.findByEmailIgnoreCase("new@vsa.com")).thenReturn(Optional.empty());
        stubEncoder();
        stubSaveEchoesArgument();

        AccountVerificationStartResponse response = userService.registerUser(user);

        User saved = captureSavedUser();
        assertEquals("hashed:rawPassword", saved.getPasswordHash());
        assertEquals("student", saved.getRole());
        assertFalse(saved.isEmailVerified());

        assertNotNull(response.getVerificationId());
        assertEquals(saved.getVerificationId(), response.getVerificationId());

        verify(emailOutboxService)
                .queueAccountVerificationEmail(any(), eq("new@vsa.com"), eq("John"), anyString());
    }

    @Test
    void registerUser_DuplicateVerifiedEmail_ThrowsException() {
        User user = newRegistration("existing@vsa.com");

        User verified = new User();
        verified.setEmailVerified(true);
        when(userRepository.findByEmailIgnoreCase("existing@vsa.com"))
                .thenReturn(Optional.of(verified));

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));

        assertEquals("Email already exists", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(emailOutboxService);
    }

    @Test
    void registerUser_ReusesPendingUnverifiedRow() {
        User user = newRegistration("pending@vsa.com");

        /*
         * A signup that was never completed. The service must update that row
         * rather than insert a second one and collide on the unique email.
         */
        User pending = new User();
        pending.setEmail("pending@vsa.com");
        pending.setEmailVerified(false);
        pending.setVerificationId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCase("pending@vsa.com")).thenReturn(Optional.of(pending));
        stubEncoder();
        stubSaveEchoesArgument();

        userService.registerUser(user);

        assertSame(pending, captureSavedUser());
        assertNotNull(pending.getVerificationCodeHash());
        assertNotNull(pending.getVerificationExpiresAt());
    }

    @Test
    void registerUser_ReturnsMaskedEmailAndExpiry() {
        User user = newRegistration("tuan@x.com");

        when(userRepository.findByEmailIgnoreCase("tuan@x.com")).thenReturn(Optional.empty());
        stubEncoder();
        stubSaveEchoesArgument();

        LocalDateTime before = LocalDateTime.now();
        AccountVerificationStartResponse response = userService.registerUser(user);

        assertEquals("t***n@x.com", response.getMaskedEmail());
        assertNotNull(response.getVerificationId());

        /* The code expires 15 minutes out, so the expiry must land in that window. */
        assertTrue(response.getExpiresAt().isAfter(before.plusMinutes(14)));
        assertTrue(response.getExpiresAt().isBefore(LocalDateTime.now().plusMinutes(16)));
    }

    @Test
    void registerUser_HashesCodeAndKeepsPlaintextOutOfTheResponse() {
        User user = newRegistration("code@vsa.com");

        when(userRepository.findByEmailIgnoreCase("code@vsa.com")).thenReturn(Optional.empty());
        stubEncoder();
        stubSaveEchoesArgument();

        userService.registerUser(user);

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailOutboxService)
                .queueAccountVerificationEmail(any(), anyString(), anyString(), codeCaptor.capture());

        String plaintextCode = codeCaptor.getValue();
        assertTrue(
                plaintextCode.matches(CODE_PATTERN),
                "generated code should be 8 unambiguous characters, was: " + plaintextCode);

        /* Only the hash is persisted; the plaintext lives in the queued email alone. */
        User saved = captureSavedUser();
        assertEquals("hashed:" + plaintextCode, saved.getVerificationCodeHash());
    }

    @Test
    void registerUser_UidProvided_ThrowsException() {
        User user = newRegistration("new@vsa.com");
        user.setUid("some-uid");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));

        assertEquals("uid must not be provided", ex.getMessage());
    }

    @Test
    void registerUser_BlankEmail_ThrowsException() {
        User user = newRegistration("   ");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));

        assertEquals("Email is required", ex.getMessage());
    }

    @Test
    void registerUser_BlankPassword_ThrowsException() {
        User user = newRegistration("new@vsa.com");
        user.setPasswordHash("  ");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));

        assertEquals("Password is required", ex.getMessage());
    }

    // ── Verification ───────────────────────────────────────────

    @Test
    void verifyEmail_NullVerificationId_ThrowsException() {
        AccountVerificationRequest request = verificationRequest(null, "ABCDEFG2");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.verifyEmail(request));

        assertEquals("Verification ID is required.", ex.getMessage());
    }

    @Test
    void verifyEmail_BlankCode_ThrowsException() {
        AccountVerificationRequest request = verificationRequest(UUID.randomUUID(), "   ");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> userService.verifyEmail(request));

        assertEquals("Verification code is required.", ex.getMessage());
    }

    @Test
    void verifyEmail_MalformedCode_ThrowsException() {
        AccountVerificationRequest tooShort = verificationRequest(UUID.randomUUID(), "ABC");

        assertEquals(
                "Invalid verification code.",
                assertThrows(IllegalArgumentException.class, () -> userService.verifyEmail(tooShort))
                        .getMessage());

        /* 0, 1, I and O are excluded from the alphabet so they can't be misread. */
        AccountVerificationRequest ambiguous = verificationRequest(UUID.randomUUID(), "ABCDEFG0");

        assertEquals(
                "Invalid verification code.",
                assertThrows(IllegalArgumentException.class, () -> userService.verifyEmail(ambiguous))
                        .getMessage());

        verify(userRepository, never()).findByVerificationId(any());
    }

    @Test
    void verifyEmail_UnknownVerificationId_ThrowsException() {
        UUID verificationId = UUID.randomUUID();
        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("Verification request was not found.", ex.getMessage());
    }

    @Test
    void verifyEmail_AlreadyVerified_ThrowsException() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setEmailVerified(true);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("This account is already verified. Please sign in.", ex.getMessage());
    }

    @Test
    void verifyEmail_ExpiredCode_ThrowsException() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setVerificationExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("Verification code has expired. Please request a new one.", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void verifyEmail_NoExpiryOnRecord_ThrowsExpiredException() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);

        /* A legacy row with no verification session is treated as expired, not as a free pass. */
        user.setVerificationExpiresAt(null);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("Verification code has expired. Please request a new one.", ex.getMessage());
    }

    @Test
    void verifyEmail_AttemptCapReached_ThrowsException() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setVerificationAttempts(5);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("Too many incorrect attempts. Please request a new code.", ex.getMessage());

        /* The counter is already at the cap, so a further guess must not be recorded. */
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void verifyEmail_WrongCode_IncrementsAttempts() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setVerificationAttempts(0);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ABCDEFG2", "hashed-code")).thenReturn(false);

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2")));

        assertEquals("Incorrect verification code.", ex.getMessage());
        assertEquals(1, captureSavedUser().getVerificationAttempts());
        assertFalse(user.isEmailVerified());
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void verifyEmail_LowercaseCodeWithWhitespace_IsNormalized() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));

        /* Only the trimmed, upper-cased form is ever compared against the hash. */
        when(passwordEncoder.matches("ABCDEFG2", "hashed-code")).thenReturn(true);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtUtil.generateToken("pending@vsa.com", "student")).thenReturn("jwt.token");

        assertEquals("jwt.token", userService.verifyEmail(verificationRequest(verificationId, "  abcdefg2  ")));
    }

    @Test
    void verifyEmail_Success_ClearsSessionAndReturnsJwt() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setVerificationAttempts(2);

        when(userRepository.findByVerificationId(verificationId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ABCDEFG2", "hashed-code")).thenReturn(true);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtUtil.generateToken("pending@vsa.com", "student")).thenReturn("jwt.token");

        String token = userService.verifyEmail(verificationRequest(verificationId, "ABCDEFG2"));

        assertEquals("jwt.token", token);
        assertTrue(user.isEmailVerified());

        /* The code is single-use, so the whole session is torn down. */
        assertNull(user.getVerificationId());
        assertNull(user.getVerificationCodeHash());
        assertNull(user.getVerificationCodeSentAt());
        assertNull(user.getVerificationExpiresAt());
        assertEquals(0, user.getVerificationAttempts());
    }

    // ── Resend ─────────────────────────────────────────────────

    @Test
    void resendVerificationCode_BlankEmail_ThrowsException() {
        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.resendVerificationCode(resendRequest("  ")));

        assertEquals("Email is required.", ex.getMessage());
    }

    @Test
    void resendVerificationCode_UnknownEmail_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase("nobody@vsa.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.resendVerificationCode(resendRequest("nobody@vsa.com")));

        assertEquals("No pending account found for this email.", ex.getMessage());
    }

    @Test
    void resendVerificationCode_AlreadyVerified_ThrowsException() {
        User user = pendingUser(UUID.randomUUID());
        user.setEmailVerified(true);

        when(userRepository.findByEmailIgnoreCase("pending@vsa.com")).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.resendVerificationCode(resendRequest("pending@vsa.com")));

        assertEquals("This account is already verified. Please sign in.", ex.getMessage());
        verifyNoInteractions(emailOutboxService);
    }

    @Test
    void resendVerificationCode_WithinCooldown_ThrowsException() {
        User user = pendingUser(UUID.randomUUID());
        user.setVerificationCodeSentAt(LocalDateTime.now().minusSeconds(30));

        when(userRepository.findByEmailIgnoreCase("pending@vsa.com")).thenReturn(Optional.of(user));

        IllegalArgumentException ex =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> userService.resendVerificationCode(resendRequest("pending@vsa.com")));

        assertEquals("Please wait before requesting another code.", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(emailOutboxService);
    }

    @Test
    void resendVerificationCode_AfterCooldown_IssuesNewCodeAndQueuesEmail() {
        User user = pendingUser(UUID.randomUUID());
        user.setVerificationCodeSentAt(LocalDateTime.now().minusSeconds(61));
        user.setVerificationAttempts(3);

        when(userRepository.findByEmailIgnoreCase("pending@vsa.com")).thenReturn(Optional.of(user));
        stubEncoder();
        stubSaveEchoesArgument();

        AccountVerificationStartResponse response =
                userService.resendVerificationCode(resendRequest("pending@vsa.com"));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailOutboxService)
                .queueAccountVerificationEmail(
                        any(), eq("pending@vsa.com"), anyString(), codeCaptor.capture());

        assertTrue(codeCaptor.getValue().matches(CODE_PATTERN));
        assertEquals("hashed:" + codeCaptor.getValue(), user.getVerificationCodeHash());

        /* A fresh code restarts the guess budget and the expiry window. */
        assertEquals(0, user.getVerificationAttempts());
        assertTrue(user.getVerificationCodeSentAt().isAfter(LocalDateTime.now().minusSeconds(5)));
        assertEquals("p***g@vsa.com", response.getMaskedEmail());
    }

    @Test
    void resendVerificationCode_KeepsSameVerificationId() {
        UUID verificationId = UUID.randomUUID();
        User user = pendingUser(verificationId);
        user.setVerificationCodeSentAt(LocalDateTime.now().minusSeconds(61));

        when(userRepository.findByEmailIgnoreCase("pending@vsa.com")).thenReturn(Optional.of(user));
        stubEncoder();
        stubSaveEchoesArgument();

        AccountVerificationStartResponse response =
                userService.resendVerificationCode(resendRequest("pending@vsa.com"));

        /*
         * issueVerificationCode only mints a UUID when there isn't one, so the page
         * that started the signup can keep using the handle it already holds.
         */
        assertEquals(verificationId, response.getVerificationId());
        assertEquals(verificationId, user.getVerificationId());
    }

    // ── Authentication ─────────────────────────────────────────

    @Test
    void login_Success_ReturnsJwt() {
        User user = new User();
        user.setEmail("user@vsa.com");
        user.setPasswordHash("hashedPass");
        user.setEmailVerified(true);
        user.setRole("student");

        when(userRepository.findByEmail("user@vsa.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPass", "hashedPass")).thenReturn(true);
        when(jwtUtil.generateToken("user@vsa.com", "student")).thenReturn("jwt.token");

        String token = userService.login("user@vsa.com", "rawPass");

        assertEquals("jwt.token", token);
    }

    @Test
    void login_UnverifiedEmail_ThrowsException() {
        User user = new User();
        user.setEmail("user@vsa.com");
        user.setEmailVerified(false);

        when(userRepository.findByEmail("user@vsa.com")).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> userService.login("user@vsa.com", "pass"));
    }

    // ── Password Management ────────────────────────────────────

    @Test
    void forgotPassword_ValidEmail_SendsResetEmail() {
        User user = new User();
        user.setEmail("user@vsa.com");
        user.setFirstName("John");

        when(userRepository.findByEmail("user@vsa.com")).thenReturn(Optional.of(user));

        userService.forgotPassword("user@vsa.com");

        assertNotNull(user.getResetToken());
        assertNotNull(user.getResetTokenExpiry());
        verify(userRepository).save(user);
        verify(emailService)
                .sendPasswordResetEmail(eq("user@vsa.com"), eq("John"), any(String.class));
    }

    @Test
    void resetPassword_ExpiredToken_ThrowsException() {
        User user = new User();
        user.setResetToken("token123");
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(5)); // Expired

        when(userRepository.findByResetToken("token123")).thenReturn(Optional.of(user));

        assertThrows(
                IllegalArgumentException.class,
                () -> userService.resetPassword("token123", "newPassword"));
    }

    // ── Fixtures ───────────────────────────────────────────────

    private User newRegistration(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("rawPassword");
        user.setFirstName("John");
        user.setLastName("Doe");
        return user;
    }

    private User pendingUser(UUID verificationId) {
        User user = new User();
        user.setEmail("pending@vsa.com");
        user.setFirstName("John");
        user.setRole("student");
        user.setEmailVerified(false);
        user.setVerificationId(verificationId);
        user.setVerificationCodeHash("hashed-code");
        user.setVerificationCodeSentAt(LocalDateTime.now());
        user.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(15));
        return user;
    }

    private AccountVerificationRequest verificationRequest(UUID verificationId, String code) {
        AccountVerificationRequest request = new AccountVerificationRequest();
        request.setVerificationId(verificationId);
        request.setCode(code);
        return request;
    }

    private AccountResendRequest resendRequest(String email) {
        AccountResendRequest request = new AccountResendRequest();
        request.setEmail(email);
        return request;
    }

    /** The password and the verification code both go through the encoder. */
    private void stubEncoder() {
        when(passwordEncoder.encode(anyString())).thenAnswer(i -> "hashed:" + i.getArgument(0));
    }

    private void stubSaveEchoesArgument() {
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
    }

    private User captureSavedUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        return captor.getValue();
    }
}
