package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vsa.dto.request.AccountResendRequest;
import com.vsa.dto.request.AccountVerificationRequest;
import com.vsa.dto.response.AccountVerificationStartResponse;
import com.vsa.model.User;
import com.vsa.service.UserService;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserService userService;

    @InjectMocks private UserController userController;

    @Test
    void registerUser_ReturnsVerificationStartResponse() {
        User inputUser = new User();
        AccountVerificationStartResponse startResponse = startResponse();
        when(userService.registerUser(inputUser)).thenReturn(startResponse);

        ResponseEntity<AccountVerificationStartResponse> response =
                userController.registerUser(inputUser);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(startResponse, response.getBody());
    }

    @Test
    void verifyEmail_ReturnsTokenAndSuccessMessage() {
        AccountVerificationRequest request = new AccountVerificationRequest();
        request.setVerificationId(UUID.randomUUID());
        request.setCode("ABCDEFG2");

        when(userService.verifyEmail(request)).thenReturn("mock.jwt.token");

        ResponseEntity<Map<String, String>> response = userController.verifyEmail(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("mock.jwt.token", response.getBody().get("token"));
        assertEquals("Email verified successfully", response.getBody().get("message"));
        verify(userService).verifyEmail(request);
    }

    @Test
    void resendVerification_ReturnsVerificationStartResponse() {
        AccountResendRequest request = new AccountResendRequest();
        request.setEmail("test@vsa.com");

        AccountVerificationStartResponse startResponse = startResponse();
        when(userService.resendVerificationCode(request)).thenReturn(startResponse);

        ResponseEntity<AccountVerificationStartResponse> response =
                userController.resendVerification(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(startResponse, response.getBody());
    }

    @Test
    void login_ValidCredentials_ReturnsTokenMap() {
        Map<String, String> requestBody =
                Map.of("email", "test@vsa.com", "password", "password123");
        when(userService.login("test@vsa.com", "password123")).thenReturn("mock.jwt.token");

        ResponseEntity<Map<String, String>> response = userController.login(requestBody);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("mock.jwt.token", response.getBody().get("token"));
        assertEquals("Login successful", response.getBody().get("message"));
    }

    @Test
    void forgotPassword_ReturnsSuccessMessage() {
        Map<String, String> requestBody = Map.of("email", "test@vsa.com");
        doNothing().when(userService).forgotPassword("test@vsa.com");

        ResponseEntity<String> response = userController.forgotPassword(requestBody);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Reset link sent to your email", response.getBody());
        verify(userService).forgotPassword("test@vsa.com");
    }

    @Test
    void resetPassword_ReturnsSuccessMessage() {
        Map<String, String> requestBody =
                Map.of("token", "resetToken123", "newPassword", "newPassword123");
        doNothing().when(userService).resetPassword("resetToken123", "newPassword123");

        ResponseEntity<String> response = userController.resetPassword(requestBody);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Password reset successfully", response.getBody());
        verify(userService).resetPassword("resetToken123", "newPassword123");
    }

    private AccountVerificationStartResponse startResponse() {
        return new AccountVerificationStartResponse(
                UUID.randomUUID(), "t***t@vsa.com", LocalDateTime.now().plusMinutes(15));
    }
}
