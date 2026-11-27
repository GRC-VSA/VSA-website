package com.vsa.controller;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.SaveTeamRequest;
import com.vsa.controller.TaskDtos.TeamResponse;
import com.vsa.service.TeamService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for officer teams.
 *
 * <p>Base endpoint: /api/teams. GET needs an officer or president JWT; everything else is
 * president-only (see SecurityConfig).
 *
 * @author VSA Development Team
 */
@RestController
@RequestMapping("/api/teams")
public class TeamController {
  private final TeamService teamService;

  public TeamController(TeamService teamService) {
    this.teamService = teamService;
  }

  @GetMapping
  public List<TeamResponse> listTeams() {
    return teamService.listTeams();
  }

  @PostMapping
  public ResponseEntity<TeamResponse> createTeam(@Valid @RequestBody SaveTeamRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(request));
  }

  /** Put a user on this team. */
  @PutMapping("/{teamId}/members/{userId}")
  public MemberResponse setMemberTeam(@PathVariable Long teamId, @PathVariable String userId) {
    return teamService.setMemberTeam(teamId, userId);
  }

  /** Take a user off their team. */
  @DeleteMapping("/members/{userId}")
  public MemberResponse removeMemberTeam(@PathVariable String userId) {
    return teamService.removeMemberTeam(userId);
  }
}
