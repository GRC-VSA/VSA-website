package com.vsa.repository;

import com.vsa.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for User entity data access.
 *
 * <p>Extends JpaRepository to provide CRUD operations on User entities. Includes custom queries for
 * email, verification sessions, and reset tokens.
 *
 * @author VSA Development Team
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

  /**
   * Finds a user by their email address.
   *
   * @param email The user's email address
   * @return Optional containing the user if found
   */
  Optional<User> findByEmail(String email);

  /**
   * Finds a user by their email address, ignoring case.
   *
   * <p>Used by registration and resend so "Tuan@x.com" and "tuan@x.com" resolve to the same
   * pending account instead of colliding on the unique email constraint.
   *
   * @param email The user's email address
   * @return Optional containing the user if found
   */
  Optional<User> findByEmailIgnoreCase(String email);

  /**
   * Finds a user by their current email-verification session id.
   *
   * @param verificationId The verification session handle issued at registration
   * @return Optional containing the user if found
   */
  Optional<User> findByVerificationId(UUID verificationId);

  /**
   * Finds a user by their password reset token.
   *
   * <p>Used during the password reset process.
   *
   * @param token The password reset token
   * @return Optional containing the user if found
   */
  Optional<User> findByResetToken(String token);

  /**
   * Checks if a user with the given email already exists.
   *
   * <p>Used to prevent duplicate email registration.
   *
   * @param email The email to check
   * @return true if a user with this email exists, false otherwise
   */
  boolean existsByEmail(String email);
}