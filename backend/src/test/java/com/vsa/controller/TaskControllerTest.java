package com.vsa.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vsa.controller.TaskDtos.*;
import com.vsa.model.Task.Priority;
import com.vsa.model.Task.Status;
import com.vsa.service.TaskService;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

  @Mock TaskService service;
  @InjectMocks TaskController controller;

  private final Principal principal = () -> "amy@vsa.com";
  private final TaskResponse task =
      new TaskResponse(
          1L, "T", null, null, null, null, null, Status.TODO, null, null, true, true, true, null,
          null, null, 0L);
  private final SaveTaskRequest save =
      new SaveTaskRequest("T", null, "u1", LocalDate.now(), Priority.LOW, null);

  @Test
  void list_passesFiltersAndPrincipal() {
    when(service.listTasks("amy@vsa.com", true, Status.TODO)).thenReturn(List.of(task));
    assertEquals(List.of(task), controller.listTasks(principal, true, Status.TODO));
  }

  @Test
  void create_returns201() {
    when(service.createTask("amy@vsa.com", save)).thenReturn(task);
    ResponseEntity<TaskResponse> response = controller.createTask(principal, save);
    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertSame(task, response.getBody());
  }

  @Test
  void getUpdateStatus_delegate() {
    UpdateStatusRequest status = new UpdateStatusRequest(Status.COMPLETED);
    when(service.getTask("amy@vsa.com", 1L)).thenReturn(task);
    when(service.updateTask("amy@vsa.com", 1L, save)).thenReturn(task);
    when(service.updateStatus("amy@vsa.com", 1L, status)).thenReturn(task);

    assertSame(task, controller.getTask(principal, 1L));
    assertSame(task, controller.updateTask(principal, 1L, save));
    assertSame(task, controller.updateStatus(principal, 1L, status));
  }

  @Test
  void delete_returns204() {
    assertEquals(HttpStatus.NO_CONTENT, controller.deleteTask(principal, 1L).getStatusCode());
    verify(service).deleteTask("amy@vsa.com", 1L);
  }

  @Test
  void assignableMembers_delegate() {
    List<MemberResponse> members = List.of(new MemberResponse("u1", "Amy Ang", null));
    when(service.listAssignableMembers()).thenReturn(members);
    assertSame(members, controller.listAssignableMembers());
  }
}
