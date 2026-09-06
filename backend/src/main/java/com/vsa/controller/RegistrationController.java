package com.vsa.controller;

import com.vsa.dto.request.RegistrationRequest;
import com.vsa.dto.request.RegistrationResendRequest;
import com.vsa.dto.request.RegistrationVerificationRequest;
import com.vsa.dto.response.RegistrationFormResponse;
import com.vsa.dto.response.RegistrationStartResponse;
import com.vsa.model.Registration;
import com.vsa.service.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/events/{eventId}/registrations")
public class RegistrationController {
    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService){
        this.registrationService = registrationService;
    }

    @GetMapping
    public ResponseEntity<List<Registration>> getRegistrations(@PathVariable Long eventId){
        return ResponseEntity.ok(registrationService.getRegistrationsForEvent(eventId));
    }

    @PostMapping
    public ResponseEntity<RegistrationStartResponse> register(@PathVariable Long eventId, @RequestBody RegistrationRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.register(eventId, request));
    }

    @GetMapping("/form")
    public ResponseEntity<RegistrationFormResponse> getRegistrationForm(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.getRegistrationForm(eventId));
    }

    @PostMapping("/verify")
    public ResponseEntity<Void> verifyRegistration(@PathVariable Long eventId, @RequestBody RegistrationVerificationRequest request) {
        registrationService.verifyRegistration(eventId, request);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/resend-code")
    public ResponseEntity<Void> resendVerificationCode(@PathVariable Long eventId, @RequestBody RegistrationResendRequest request) {
        registrationService.resendVerificationCode(eventId, request);
        return ResponseEntity.ok().build();
    }
}
