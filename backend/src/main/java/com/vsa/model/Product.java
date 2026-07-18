package com.vsa.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a Product sold by VSA.
 *
 * <p>Contains product details including name, description, price, and inventory information.
 * Supports product images and bestseller designation.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "products")
public class Product {
  // ── Primary Key ────────────────────────────────────────────
  /** Unique identifier for the product (auto-generated) */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // ── Product Information ────────────────────────────────────
  /** Name of the product */
  @Column(nullable = false)
  private String name;

  /** Detailed description of the product (up to 1000 characters) */
  @Column(length = 1000)
  private String description;

  // ── Pricing & Inventory ────────────────────────────────────
  /** Price of the product */
  @Column(nullable = false)
  private double price;

  /** Current stock quantity available */
  @Column(nullable = false)
  private int stock;

  // ── Media & Special Designation ────────────────────────────
  /** URL to the product's image */
  @Column(name = "image_url")
  private String imageUrl;

  /** Flag indicating if this is a bestseller product */
  private boolean bestSeller;
}
