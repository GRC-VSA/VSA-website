package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vsa.model.Product;
import com.vsa.service.FileStorageService;
import com.vsa.service.ProductService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock private ProductService productService;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks private ProductController productController;

    @Test
    void getProducts_ReturnsProductList() {
        List<Product> mockProducts = List.of(new Product(), new Product());
        when(productService.getAllProducts()).thenReturn(mockProducts);

        ResponseEntity<List<Product>> response = productController.getProducts();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
    }

    @Test
    void createProduct_WithImage_SavesImageAndProduct() {
        Product inputProduct = new Product();
        MockMultipartFile image =
                new MockMultipartFile("image", "test.jpg", "image/jpeg", "image content".getBytes());

        when(fileStorageService.save(image)).thenReturn("/uploads/unique_test.jpg");
        when(productService.createProduct(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<Product> response = productController.createProduct(inputProduct, image);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("/uploads/unique_test.jpg", response.getBody().getImageUrl());
        verify(fileStorageService).save(image);
        verify(productService).createProduct(inputProduct);
    }

    @Test
    void createProduct_WithoutImage_CreatesProductOnly() {
        Product inputProduct = new Product();

        when(productService.createProduct(inputProduct)).thenReturn(inputProduct);

        ResponseEntity<Product> response = productController.createProduct(inputProduct, null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(fileStorageService, never()).save(any());
        verify(productService).createProduct(inputProduct);
    }
}