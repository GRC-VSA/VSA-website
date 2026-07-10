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

@Service
public class FileStorageService {
  // Files saved in folder "uploads" in project root
  private final Path uploadDir = Paths.get("uploads");

  @PostConstruct
  public void init() {
    try {
      Files.createDirectories(uploadDir);
    } catch (IOException e) {
      throw new RuntimeException("Could not initialize uploads directory");
    }
  }

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
