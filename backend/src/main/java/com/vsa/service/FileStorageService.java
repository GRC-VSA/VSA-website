package com.vsa.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileStorageService {

  private final S3Client s3Client;

  @Value("${aws.s3.bucket-name}")
  private String bucketName;

  @Value("${aws.region}")
  private String region;

  public FileStorageService(S3Client s3Client) {
    this.s3Client = s3Client;
  }

  public String saveFile(MultipartFile file) throws IOException {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("Cannot store empty file.");
    }

    String originalFileName = file.getOriginalFilename();
    String fileExtension = "";
    if (originalFileName != null && originalFileName.contains(".")) {
      fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
    }
    String fileName = UUID.randomUUID().toString() + fileExtension;

    PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .contentType(file.getContentType())
            .build();

    s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

    return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, fileName);
  }

  public void deleteFile(String fileUrlOrName) {
    if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
      return;
    }

    String fileName = fileUrlOrName;
    if (fileUrlOrName.contains(".amazonaws.com/")) {
      fileName = fileUrlOrName.substring(fileUrlOrName.lastIndexOf("/") + 1);
    }

    DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .build();

    s3Client.deleteObject(deleteObjectRequest);
  }
}