package com.vsa.service;

import com.vsa.controller.TaskDtos.MemberResponse;
import com.vsa.controller.TaskDtos.SaveTeamRequest;
import com.vsa.controller.TaskDtos.TeamResponse;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Team;
import com.vsa.model.User;
import com.vsa.repository.TeamRepository;
import com.vsa.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Officer teams and who belongs to them. Reading is open to officers; writing is president-only
 * (enforced in SecurityConfig).
 *
 * <p>Changing someone's team does not touch their existing tasks: each task keeps the team it was
 * assigned under (see {@link com.vsa.model.Task#getTeam()}).
 *
 * @author VSA Development Team
 */
@Service
@Transactional
public class TeamService {

  private final TeamRepository teamRepository;
  private final UserRepository userRepository;

  public TeamService(TeamRepository teamRepository, UserRepository userRepository) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<TeamResponse> listTeams() {
    return teamRepository.findAllByOrderByNameAsc().stream().map(TaskMapper::team).toList();
  }

  public TeamResponse createTeam(SaveTeamRequest request) {
    String name = request.name().trim();
    // Checked here for a friendly message; the UNIQUE constraint still guards against a race.
    if (teamRepository.existsByNameIgnoreCase(name)) {
      throw new ConflictException("A team named \"" + name + "\" already exists");
    }
    Team team = new Team();
    team.setName(name);
    return TaskMapper.team(teamRepository.save(team));
  }

  /** Put an officer or president on a team (moving them off any previous one). */
  public MemberResponse setMemberTeam(Long teamId, String userId) {
    Team team =
        teamRepository
            .findById(teamId)
            .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
    User user = requireMember(userId);
    user.setTeam(team);
    return TaskMapper.member(user);
  }

  /** Take a user off their team. */
  public MemberResponse removeMemberTeam(String userId) {
    User user = requireMember(userId);
    user.setTeam(null);
    return TaskMapper.member(user);
  }

  private User requireMember(String userId) {
    return userRepository
        .findById(userId)
        .filter(user -> TaskService.MEMBER_ROLES.contains(user.getRole().toLowerCase()))
        .orElseThrow(
            () -> new IllegalArgumentException("Only officers and presidents can join a team"));
  }
}
