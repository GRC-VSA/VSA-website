package com.vsa.repository;

import com.vsa.model.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  // Bestseller group in homepage
  List<Product> findByBestSellerTrue();

  // Search products by name (for future search feature)
  List<Product> findByNameContainingIgnoreCase(String name);
}
