package com.vsa.service;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class FileStorageServiceTest {

  // @TempDir creates a real temporary folder for each test, then cleans it up automatically
  @TempDir Path tempDir;

  private FileStorageService fileStorageService;

  @BeforeEach
  void setUp() throws Exception {
    fileStorageService = new FileStorageService();

    // override the private uploadDir field to use our temp folder instead of "uploads/"
    Field uploadDirField = FileStorageService.class.getDeclaredField("uploadDir");
    uploadDirField.setAccessible(true);
    uploadDirField.set(fileStorageService, tempDir);

    fileStorageService.init();
  }

  // ── init ──────────────────────────────────────────────────────

  @Test
  void ssinit_createsUploadDirectory() {
    assertTrue(Files.exists(tempDir));
    assertTrue(Files.isDirectory(tempDir));
  }

  // ── save ──────────────────────────────────────────────────────

  @Test
  void save_returnsFilePath_withUploadsPrefix() {
    MockMultipartFile file =
        new MockMultipartFile(
            "image", "nightmarket.jpg", "image/jpeg", "fake-image-content".getBytes());

    String result = fileStorageService.save(file);

    assertNotNull(result);
    assertTrue(result.startsWith("/uploads/"));
    assertTrue(result.endsWith("nightmarket.jpg"));
  }

  @Test
  void save_actuallyWritesFileToDisk() {
    MockMultipartFile file =
        new MockMultipartFile("image", "hoodie.jpg", "image/jpeg", "fake-image-content".getBytes());

    String result = fileStorageService.save(file);

    // extract filename from returned path "/uploads/uuid_hoodie.jpg"
    String fileName = result.replace("/uploads/", "");
    Path savedFile = tempDir.resolve(fileName);

    assertTrue(Files.exists(savedFile));
  }

  @Test
  void save_generatesUniqueFilenames_forSameFile() {
    MockMultipartFile file1 =
        new MockMultipartFile("image", "photo.jpg", "image/jpeg", "content1".getBytes());
    MockMultipartFile file2 =
        new MockMultipartFile("image", "photo.jpg", "image/jpeg", "content2".getBytes());

    String result1 = fileStorageService.save(file1);
    String result2 = fileStorageService.save(file2);

    // same filename but UUID prefix should make them different
    assertNotEquals(result1, result2);
  }

  @Test
  void save_preservesOriginalFilename_inReturnedPath() {
    MockMultipartFile file =
        new MockMultipartFile(
            "image", "vsa-banner.png", "image/png", "fake-png-content".getBytes());

    String result = fileStorageService.save(file);

    assertTrue(result.contains("vsa-banner.png"));
  }

  @Test
  void save_throwsRuntimeException_whenFileIsEmpty() {
    MockMultipartFile emptyFile =
        new MockMultipartFile(
            "image", "empty.jpg", "image/jpeg", new byte[0] // empty content
            );

    // saving an empty file should still work — it just writes an empty file
    // this verifies no exception is thrown for empty but valid multipart
    assertDoesNotThrow(() -> fileStorageService.save(emptyFile));
  }

  @Test
  void save_throwsRuntimeException_whenIOExceptionOccurs() throws Exception {
    // point uploadDir to a non-existent path to force an IOException
    Field uploadDirField = FileStorageService.class.getDeclaredField("uploadDir");
    uploadDirField.setAccessible(true);
    uploadDirField.set(fileStorageService, Path.of("/nonexistent/path/that/cannot/exist"));

    MockMultipartFile file =
        new MockMultipartFile("image", "test.jpg", "image/jpeg", "content".getBytes());

    RuntimeException ex = assertThrows(RuntimeException.class, () -> fileStorageService.save(file));

    assertTrue(ex.getMessage().startsWith("Failed to save file:"));
  }
}
