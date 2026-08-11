package com.vsa.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

  @Mock
  private S3Client s3Client;

  private FileStorageService fileStorageService;

  @BeforeEach
  void setUp() throws Exception {
    fileStorageService = new FileStorageService(s3Client);

    // Inject @Value private fields using reflection
    setField(fileStorageService, "bucketName", "vsa-grc-event-images");
    setField(fileStorageService, "region", "us-east-2");
  }

  private void setField(Object target, String fieldName, Object value) throws Exception {
    Field field = target.getClass().getDeclaredField(fieldName);
    field.setAccessible(true);
    field.set(target, value);
  }

  // ── saveFile ──────────────────────────────────────────────────

  @Test
  void saveFile_returnsFullS3Url_onSuccess() throws Exception {
    MockMultipartFile file =
            new MockMultipartFile(
                    "image", "nightmarket.jpg", "image/jpeg", "fake-image-content".getBytes());

    String resultUrl = fileStorageService.saveFile(file);

    assertNotNull(resultUrl);
    assertTrue(resultUrl.startsWith("https://vsa-grc-event-images.s3.us-east-2.amazonaws.com/"));
    assertTrue(resultUrl.endsWith(".jpg"));

    // Verify S3 client putObject call
    verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
  }

  @Test
  void saveFile_sendsCorrectBucketAndContentTypeToS3() throws Exception {
    MockMultipartFile file =
            new MockMultipartFile(
                    "image", "vsa-banner.png", "image/png", "fake-png-content".getBytes());

    fileStorageService.saveFile(file);

    ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
    verify(s3Client).putObject(captor.capture(), any(RequestBody.class));

    PutObjectRequest request = captor.getValue();
    assertEquals("vsa-grc-event-images", request.bucket());
    assertEquals("image/png", request.contentType());
    assertTrue(request.key().endsWith(".png"));
  }

  @Test
  void saveFile_generatesUniqueKeys_forSameFileName() throws Exception {
    MockMultipartFile file1 =
            new MockMultipartFile("image", "photo.jpg", "image/jpeg", "content1".getBytes());
    MockMultipartFile file2 =
            new MockMultipartFile("image", "photo.jpg", "image/jpeg", "content2".getBytes());

    String url1 = fileStorageService.saveFile(file1);
    String url2 = fileStorageService.saveFile(file2);

    // UUID prefixes should make S3 URLs unique
    assertNotEquals(url1, url2);
  }

  @Test
  void saveFile_throwsIllegalArgumentException_whenFileIsEmpty() {
    MockMultipartFile emptyFile =
            new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]);

    IllegalArgumentException ex =
            assertThrows(IllegalArgumentException.class, () -> fileStorageService.saveFile(emptyFile));

    assertEquals("Cannot store empty file.", ex.getMessage());
    verifyNoInteractions(s3Client);
  }

  @Test
  void saveFile_propagatesException_whenS3ClientFails() {
    MockMultipartFile file =
            new MockMultipartFile("image", "test.jpg", "image/jpeg", "content".getBytes());

    doThrow(S3Exception.builder().message("Access Denied").build())
            .when(s3Client)
            .putObject(any(PutObjectRequest.class), any(RequestBody.class));

    assertThrows(S3Exception.class, () -> fileStorageService.saveFile(file));
  }

  // ── deleteFile ────────────────────────────────────────────────

  @Test
  void deleteFile_extractsKeyFromFullUrl_andCallsDeleteObject() {
    String fullS3Url = "https://vsa-grc-event-images.s3.us-east-2.amazonaws.com/1234-uuid-nightmarket.jpg";

    fileStorageService.deleteFile(fullS3Url);

    ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
    verify(s3Client).deleteObject(captor.capture());

    DeleteObjectRequest request = captor.getValue();
    assertEquals("vsa-grc-event-images", request.bucket());
    assertEquals("1234-uuid-nightmarket.jpg", request.key());
  }

  @Test
  void deleteFile_acceptsRawKey_andCallsDeleteObject() {
    String rawKey = "1234-uuid-nightmarket.jpg";

    fileStorageService.deleteFile(rawKey);

    ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
    verify(s3Client).deleteObject(captor.capture());

    assertEquals("1234-uuid-nightmarket.jpg", captor.getValue().key());
  }

  @Test
  void deleteFile_doesNothing_whenFileUrlOrNameNullOrBlank() {
    fileStorageService.deleteFile(null);
    fileStorageService.deleteFile("");
    fileStorageService.deleteFile("   ");

    verifyNoInteractions(s3Client);
  }
}