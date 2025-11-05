package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.UserCreateRequest;
import stu.kho.backend.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }
    //Tao user moi <Hoan Thanh>
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users")
    public ResponseEntity<String> createUser(@RequestBody UserCreateRequest request) {
        try {
            userService.createNewUser(request);
            return ResponseEntity.ok("Người dùng " + request.getTenDangNhap() + " đã được tạo và cấp quyền thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    //Chuc nang khac cho role admin <Chua hoan thanh>
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/config/{key}")
    public ResponseEntity<String> updateSystemConfig(@PathVariable String key, @RequestBody String value) {
        return ResponseEntity.ok("Cấu hình [" + key + "] đã được cập nhật thành công.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/config/{key}")
    public ResponseEntity<String> getSystemConfig(@PathVariable String key) {
        return ResponseEntity.ok("Giá trị cấu hình [" + key + "]: XXXXXX");
    }
}