    package com.vsa.service;

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;

    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.stereotype.Service;
    import org.springframework.web.multipart.MultipartFile;

    import software.amazon.awssdk.core.exception.SdkClientException;
    import software.amazon.awssdk.core.sync.RequestBody;
    import software.amazon.awssdk.services.s3.S3Client;
    import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
    import software.amazon.awssdk.services.s3.model.PutObjectRequest;
    import software.amazon.awssdk.services.s3.model.S3Exception;

    import java.io.IOException;
    import java.util.UUID;
    import java.net.URI;

    @Service
    public class FileStorageService {

      private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

      private final S3Client s3Client;

      @Value("${aws.s3.bucket-name}")
      private String bucketName;

      @Value("${aws.cloudfront.domain}")
      private String cloudFrontDomain;

      public FileStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
      }

      public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
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

        try {
          log.info("Uploading file to S3. Bucket={}, Key={}, Size={} bytes", bucketName, fileName, file.getSize());
          s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
          log.info("Successfully uploaded file to S3. Bucket={}, Key={}", bucketName, fileName);
        } 
        catch (S3Exception e) {
          log.error("S3 rejected file upload. Bucket={}, Key={}, Status={}, Code={}, Message={}", 
          bucketName, fileName, e.statusCode(), e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : "unknown", e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage(), e);
          throw e;

        }
        catch (SdkClientException e) {
          log.error("AWS SDK failed while uploading file. Bucket={}, Key={}, Message={}", bucketName, fileName, e.getMessage(), e);
          throw e;
        }
        catch (IOException e) {
          log.error("Failed to read uploaded file before sending it to S3. OriginalFileName={}, Message={}", originalFileName, e.getMessage(), e);
          throw new RuntimeException("Failed to store file on S3: " + e.getMessage(), e);
        }
        String baseUrl = cloudFrontDomain.replaceAll("/+$", "");

        String imageUrl = baseUrl + "/" + fileName;
        log.info("Generated CloudFront image URL. Key={}, URL={}", fileName, imageUrl);
        return imageUrl;
      }

      public void deleteFile(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
          return;
        }

        String fileName = fileUrlOrName;

        try {
          if (fileUrlOrName.startsWith("http://") || fileUrlOrName.startsWith("https://")) {
            String path = URI.create(fileUrlOrName).getPath();
            fileName = path.substring(path.lastIndexOf("/") + 1);
          }
        } catch (IllegalArgumentException e) {
            log.error("Invalid file URL while preparing S3 deletion. Value={}", fileUrlOrName, e);
            throw e;
          }
          if (fileName.isBlank()) {
            throw new IllegalArgumentException("Unable to determine S3 object key from: " + fileUrlOrName);
          }

        DeleteObjectRequest deleteObjectRequest =
          DeleteObjectRequest.builder()
          .bucket(bucketName)
          .key(fileName)
          .build();

        try {
          log.info("Deleting file from S3. Bucket={}, Key={}", bucketName, fileName);
          s3Client.deleteObject(deleteObjectRequest);

          log.info("Successfully deleted file from S3. Bucket={}, Key={}", bucketName, fileName);

        } catch (S3Exception e) {
            log.error("S3 rejected file deletion. Bucket={}, Key={}, Status={}, Code={}, Message={}", 
              bucketName, fileName, e.statusCode(), e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode(): "unknown",
              e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage(), e
            );
            throw e;
          } 
          catch (SdkClientException e) {
            log.error("AWS SDK failed while deleting file from S3. Bucket={}, Key={}, Message={}", bucketName, fileName, e.getMessage(), e);
            throw e;
          }
      }
    }