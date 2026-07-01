package com.vsa.repository;

import com.vsa.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // For Ongoing Events page
    List<Event> findByOngoingTrue();

    //For filtering ongoing event by category (sport, field trip, club meeting)
    List<Event> findByOngoingTrueAndCategory(String category);

    //For the archived events page, then filtered by generation
    List<Event> findByOngoingFalseAndVsaGen(String vsaGen);

    //Get all archived events
    List<Event> findByOngoingFalse();



}
