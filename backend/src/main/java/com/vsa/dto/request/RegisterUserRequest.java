package com.vsa.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterUserRequest {

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String password;
}