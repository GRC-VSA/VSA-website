package com.vsa.repository;

import com.vsa.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

  Optional<User> findByEmail(String email);

  Optional<User> findByVerificationToken(String token);

  Optional<User> findByResetToken(String token);

  boolean existsByEmail(String email);
}
