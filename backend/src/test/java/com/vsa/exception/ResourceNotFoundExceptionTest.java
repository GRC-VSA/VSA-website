package com.vsa.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ResourceNotFoundExceptionTest {

    @Test
    void exceptionFieldsSetCorrectly() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Product", 42L);

        assertEquals("Product", ex.getResourceName());
        assertEquals(42L, ex.getResourceId());
        assertEquals("Resource with id 42 not found", ex.getMessage());
    }
}