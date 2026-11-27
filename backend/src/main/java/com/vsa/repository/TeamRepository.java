package com.vsa.repository;

import com.vsa.model.Team;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Data access for {@link Team}. */
@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

  List<Team> findAllByOrderByNameAsc();

  boolean existsByNameIgnoreCase(String name);
}
