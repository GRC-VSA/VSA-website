package com.vsa.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vsa.model.User;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired private UserRepository userRepository;

    @Test
    void findByEmail_ReturnsUser() {
        User user = createUser("SID123", "test@vsa.com");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("test@vsa.com");

        assertTrue(found.isPresent());
        assertEquals("SID123", found.get().getSid());
    }

    @Test
    void findByVerificationToken_ReturnsUser() {
        User user = createUser("SID124", "verify@vsa.com");
        user.setVerificationToken("vToken123");
        userRepository.save(user);

        Optional<User> found = userRepository.findByVerificationToken("vToken123");

        assertTrue(found.isPresent());
        assertEquals("verify@vsa.com", found.get().getEmail());
    }

    @Test
    void findByResetToken_ReturnsUser() {
        User user = createUser("SID125", "reset@vsa.com");
        user.setResetToken("rToken123");
        userRepository.save(user);

        Optional<User> found = userRepository.findByResetToken("rToken123");

        assertTrue(found.isPresent());
        assertEquals("reset@vsa.com", found.get().getEmail());
    }

    @Test
    void existsByEmail_ReturnsTrueWhenExists() {
        User user = createUser("SID126", "exists@vsa.com");
        userRepository.save(user);

        assertTrue(userRepository.existsByEmail("exists@vsa.com"));
    }

    private User createUser(String sid, String email) {
        User user = new User();
        user.setSid(sid);
        user.setFirstName("First");
        user.setLastName("Last");
        user.setEmail(email);
        user.setPasswordHash("hashedPass");
        return user;
    }
}