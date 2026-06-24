package com.vsa.controller;

import com.vsa.model.Event;
import com.vsa.model.Product;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {
    private final List<Product> products = new ArrayList<>();

    @GetMapping
    public ResponseEntity<List<Product>> getProducts() {
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<Product> createEvent (@RequestBody Product product){
        products.add(product);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(product);
    }
}
