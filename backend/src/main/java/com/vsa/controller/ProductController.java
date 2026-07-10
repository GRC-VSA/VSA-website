package com.vsa.controller;

import com.vsa.model.Product;
import com.vsa.service.FileStorageService;
import com.vsa.service.ProductService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {
  private final ProductService productService;
  private final FileStorageService fileStorageService;

  public ProductController(ProductService productService, FileStorageService fileStorageService) {
    this.productService = productService;
    this.fileStorageService = fileStorageService;
  }

  @GetMapping
  public ResponseEntity<List<Product>> getProducts() {
    return ResponseEntity.ok(productService.getAllProducts());
  }

  @PostMapping
  public ResponseEntity<Product> createProduct(
      @RequestPart("product") Product product,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    if (image != null && !image.isEmpty()) {
      String imageUrl = fileStorageService.save(image);
      product.setImageUrl(imageUrl);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(product));
  }
}
