package com.vsa.service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service class for managing file uploads and storage.
 *
 * <p>Handles saving uploaded files to the file system with unique names to prevent conflicts. Files
 * are stored in the "uploads" directory in the project root.
 *
 * @author VSA Development Team
 */
@Service
public class FileStorageService {
  // ── Configuration ──────────────────────────────────────────
  /** Directory where uploaded files are stored */
  private final Path uploadDir = Paths.get("uploads");

  // ── Initialization ────────────────────────────────────────

  /**
   * Initializes the upload directory on service startup.
   *
   * <p>Creates the "uploads" directory if it doesn't exist.
   *
   * @throws RuntimeException If the directory cannot be created
   */
  @PostConstruct
  public void init() {
    try {
      Files.createDirectories(uploadDir);
    } catch (IOException e) {
      throw new RuntimeException("Could not initialize uploads directory");
    }
  }

  // ── File Operations ────────────────────────────────────────

  /**
   * Saves an uploaded file to the file system.
   *
   * <p>Generates a unique filename using UUID to prevent overwrites. Returns the relative path that
   * can be used to access the file through the web server.
   *
   * @param file The multipart file to save
   * @return The relative path to the saved file (e.g., "/uploads/uuid_filename.ext")
   * @throws RuntimeException If the file cannot be saved due to I/O errors
   */
  public String save(MultipartFile file) {
    try {
      String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
      Path filePath = uploadDir.resolve(fileName);
      Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
      return "/uploads/" + fileName;
    } catch (IOException e) {
      throw new RuntimeException("Failed to save file: " + e.getMessage());
    }
  }
}
