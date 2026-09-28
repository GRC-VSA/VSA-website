package com.vsa.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveApplicationBuilderRequest(

    @NotNull
    Boolean recruitmentOpen,

    @NotNull
    List<@Valid BuilderRoleRequest> roles,

    @NotNull
    List<@Valid BuilderSectionRequest> sections

) {

    public record BuilderRoleRequest(

        /*
         * null = new unsaved role
         * positive value = existing database role
         */
        Long applicationRoleId,

        @NotBlank
        @Size(max = 255)
        String name,

        @Size(max = 3000)
        String description,

        boolean recruiting,

        /*
         * Ordered list.
         *
         * These are section CLIENT IDs, not necessarily
         * database section IDs.
         */
        @NotEmpty
        List<@NotNull Long> sectionClientIds

    ) {}


    public record BuilderSectionRequest(

        /*
         * Frontend-only identifier.
         *
         * Existing section:
         * clientId can equal sectionId.
         *
         * New section:
         * clientId can be -1, -2, -3, etc.
         */
        @NotNull
        Long clientId,

        /*
         * null = new section
         * positive value = existing database section
         */
        Long sectionId,

        @NotBlank
        @Size(max = 255)
        String sectionHeading,

        @Size(max = 3000)
        String sectionDescription,

        @NotNull
        List<@Valid BuilderQuestionRequest> questions

    ) {}


    public record BuilderQuestionRequest(

        /*
         * null = new question
         * positive value = existing database question
         */
        Long questionId,

        @NotBlank
        @Size(max = 2000)
        String questionText,

        @NotBlank
        @Size(max = 20)
        String questionType,

        boolean required,

        boolean active,

        /*
         * Question order comes from its position
         * inside the questions list.
         */
        List<
            @NotBlank
            @Size(max = 500)
            String
        > options

    ) {}
}