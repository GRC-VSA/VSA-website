package com.vsa.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ProductTest {

    @Test
    void productGettersAndSetters() {
        Product product = new Product();
        product.setId(1L);
        product.setName("T-Shirt");
        product.setDescription("VSA Merch");
        product.setPrice(19.99);
        product.setStock(100);
        product.setImageUrl("/uploads/tshirt.png");
        product.setBestSeller(true);

        assertEquals(1L, product.getId());
        assertEquals("T-Shirt", product.getName());
        assertEquals("VSA Merch", product.getDescription());
        assertEquals(19.99, product.getPrice());
        assertEquals(100, product.getStock());
        assertEquals("/uploads/tshirt.png", product.getImageUrl());
        assertTrue(product.isBestSeller());
    }
}