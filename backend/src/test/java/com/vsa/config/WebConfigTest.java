package com.vsa.config;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

class WebConfigTest {

    private WebConfig webConfig;

    @BeforeEach
    void setUp() {
        webConfig = new WebConfig();
        ReflectionTestUtils.setField(webConfig, "frontendUrl", "http://localhost:3000");
    }

    @Test
    void addResourceHandlers_RegistersUploadsDirectory() {
        ResourceHandlerRegistry registry = mock(ResourceHandlerRegistry.class);
        ResourceHandlerRegistration registration = mock(ResourceHandlerRegistration.class);

        when(registry.addResourceHandler("/uploads/**")).thenReturn(registration);

        webConfig.addResourceHandlers(registry);

        verify(registry).addResourceHandler("/uploads/**");
        verify(registration).addResourceLocations("file:uploads/");
    }

    @Test
    void addCorsMappings_RegistersApiMappings() {
        CorsRegistry registry = mock(CorsRegistry.class);
        CorsRegistration registration = mock(CorsRegistration.class);

        when(registry.addMapping("/api/**")).thenReturn(registration);
        when(registration.allowedOrigins("http://localhost:3000")).thenReturn(registration);
        when(registration.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS"))
                .thenReturn(registration);
        when(registration.allowedHeaders("*")).thenReturn(registration);
        when(registration.allowCredentials(true)).thenReturn(registration);

        webConfig.addCorsMappings(registry);

        verify(registry).addMapping("/api/**");
        verify(registration).allowedOrigins("http://localhost:3000");
    }
}