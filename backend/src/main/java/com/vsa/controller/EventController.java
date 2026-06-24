package com.vsa.controller;

import com.vsa.model.Event;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {

    private final List<Event> events = new ArrayList<>();

    @GetMapping
    public ResponseEntity<List<Event>> getEvents() {
        return ResponseEntity.ok(events);
    }

    @PostMapping
    public ResponseEntity<Event> createEvent (@RequestBody Event event){
        events.add(event);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(event);
    }
}
