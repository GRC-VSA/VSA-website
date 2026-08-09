package com.vsa.repository;

import com.vsa.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Product entity data access.
 *
 * <p>Extends JpaRepository to provide CRUD operations on Product entities.
 *
 * @author VSA Development Team
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {}
