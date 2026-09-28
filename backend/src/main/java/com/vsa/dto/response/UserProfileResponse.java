package com.vsa.dto.response;

public record UserProfileResponse(

    String uid,

    String firstName,

    String lastName,

    String email,

    String phone,

    String role,

    String profileImageUrl

) {}
