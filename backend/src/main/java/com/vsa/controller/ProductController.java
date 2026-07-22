package com.vsa.controller;

import com.vsa.model.Product;
import com.vsa.service.FileStorageService;
import com.vsa.service.ProductService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for managing Product operations.
 *
 * <p>Provides endpoints for retrieving and creating products. Supports file uploads for product
 * images in multipart/form-data format.
 *
 * <p>Base endpoint: /api/products
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {
  // ── Dependencies ──────────────────────────────────────────
  private final ProductService productService;
  private final FileStorageService fileStorageService;

  /**
   * Constructs a ProductController with required dependencies.
   *
   * @param productService Service for product operations
   * @param fileStorageService Service for file storage operations
   */
  public ProductController(ProductService productService, FileStorageService fileStorageService) {
    this.productService = productService;
    this.fileStorageService = fileStorageService;
  }

  // ── GET Endpoints ──────────────────────────────────────────

  /**
   * Retrieves all products.
   *
   * @return ResponseEntity containing a list of all products
   */
  @GetMapping
  public ResponseEntity<List<Product>> getProducts() {
    return ResponseEntity.ok(productService.getAllProducts());
  }

  // ── POST Endpoints ────────────────────────────────────────

  /**
   * Creates a new product with multipart form data (including optional image).
   *
   * <p>When an image file is provided, it will be stored and the image URL will be set on the
   * product.
   *
   * @param product The product details
   * @param image Optional image file for the product
   * @return ResponseEntity with status 201 (Created) and the created product
   */
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
