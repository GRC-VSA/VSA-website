package com.vsa.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vsa.model.User;
import com.vsa.repository.UserRepository;
import com.vsa.security.JwtUtil;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;

    @InjectMocks private UserService userService;

    @Test
    void registerUser_Success() {
        User user = new User();
        user.setEmail("new@vsa.com");
        user.setPasswordHash("rawPassword");
        user.setFirstName("John");

        when(userRepository.existsByEmail("new@vsa.com")).thenReturn(false);
        when(passwordEncoder.encode("rawPassword")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User registered = userService.registerUser(user);

        assertEquals("hashedPassword", registered.getPasswordHash());
        assertEquals("student", registered.getRole());
        assertFalse(registered.isEmailVerified());
        assertNotNull(registered.getVerificationToken());

        verify(emailService)
                .sendVerificationEmail(eq("new@vsa.com"), eq("John"), any(String.class));
    }

    @Test
    void registerUser_DuplicateEmail_ThrowsException() {
        User user = new User();
        user.setEmail("existing@vsa.com");

        when(userRepository.existsByEmail("existing@vsa.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));
    }

    @Test
    void verifyEmail_ValidToken_VerifiesUser() {
        User user = new User();
        user.setVerificationToken("token123");
        user.setEmailVerified(false);

        when(userRepository.findByVerificationToken("token123")).thenReturn(Optional.of(user));

        userService.verifyEmail("token123");

        assertTrue(user.isEmailVerified());
        assertNull(user.getVerificationToken());
        verify(userRepository).save(user);
    }

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
}