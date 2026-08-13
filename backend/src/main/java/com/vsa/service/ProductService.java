package com.vsa.service;

import com.vsa.model.Product;
import com.vsa.repository.ProductRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service class for managing Product operations.
 *
 * <p>Handles business logic for CRUD operations on products.
 *
 * @author VSA Development Team
 */
@Service
public class ProductService {
  // ── Dependencies ──────────────────────────────────────────
  private final ProductRepository productRepository;

  /**
   * Constructs a ProductService with required dependencies.
   *
   * @param productRepository Repository for product data access
   */
  @Autowired
  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  // ── Read Operations ────────────────────────────────────────

  /**
   * Retrieves all products from the database.
   *
   * @return List of all products
   */
  public List<Product> getAllProducts() {
    return productRepository.findAll();
  }

  // ── Create Operations ──────────────────────────────────────

  /**
   * Creates a new product in the database.
   *
   * @param product The product to create
   * @return The created product with ID generated
   */
  public Product createProduct(Product product) {
    return productRepository.save(product);
  }
}
