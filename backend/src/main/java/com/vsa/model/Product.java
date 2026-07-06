package com.vsa.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@RequiredArgsConstructor
@Table(name = "products")
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(length = 1000)
  private String description;

  @Column(nullable = false)
  private double price;

  @Column(nullable = false)
  private int stock;

  @Column(name = "image_url")
  private String imageUrl;

  private boolean bestSeller;
}
