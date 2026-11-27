package com.vsa.service;

import static com.vsa.service.AvailabilityTestData.user;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.vsa.controller.TaskDtos.SaveTeamRequest;
import com.vsa.exception.ConflictException;
import com.vsa.exception.ResourceNotFoundException;
import com.vsa.model.Team;
import com.vsa.model.User;
import com.vsa.repository.TeamRepository;
import com.vsa.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

  @Mock TeamRepository teamRepository;
  @Mock UserRepository userRepository;

  TeamService service;

  @BeforeEach
  void setUp() {
    service = new TeamService(teamRepository, userRepository);
  }

  @Test
  void create_trimsName_andRejectsDuplicates() {
    when(teamRepository.existsByNameIgnoreCase("Marketing")).thenReturn(false);
    when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));
    assertEquals("Marketing", service.createTeam(new SaveTeamRequest("  Marketing ")).name());

    when(teamRepository.existsByNameIgnoreCase("Marketing")).thenReturn(true);
    assertThrows(
        ConflictException.class, () -> service.createTeam(new SaveTeamRequest("Marketing")));
  }

  @Test
  void setMemberTeam_movesOfficer_rejectsStudent() {
    Team team = TaskServiceTest.team(1L, "Marketing");
    User officer = user("u1", "Amy", "Ang", "officer");
    User student = user("u2", "Stu", "Su", "student");
    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
    when(userRepository.findById("u1")).thenReturn(Optional.of(officer));
    when(userRepository.findById("u2")).thenReturn(Optional.of(student));

    assertEquals("Marketing", service.setMemberTeam(1L, "u1").team());
    assertSame(team, officer.getTeam());
    assertThrows(IllegalArgumentException.class, () -> service.setMemberTeam(1L, "u2"));

    assertNull(service.removeMemberTeam("u1").team());
    assertNull(officer.getTeam());
  }

  @Test
  void setMemberTeam_unknownTeam_is404() {
    when(teamRepository.findById(9L)).thenReturn(Optional.empty());
    assertThrows(ResourceNotFoundException.class, () -> service.setMemberTeam(9L, "u1"));
  }
}
