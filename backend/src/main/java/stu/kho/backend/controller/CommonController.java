package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import stu.kho.backend.dto.UserResponse;
import stu.kho.backend.service.UserService;

@RestController
@RequestMapping("/api/common")
@CrossOrigin(origins = "*")

public class CommonController {

    private final UserService userService;

    // Inject UserService
    public CommonController(UserService userService) {
        this.userService = userService;
    }

    // API: Lấy thông tin người dùng đang đăng nhập
    @GetMapping("/user-info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getUserInfo(Authentication authentication) {
        // 1. Lấy tên đăng nhập từ Token (đã xác thực)
        String username = authentication.getName();

        // 2. Gọi Service để lấy thông tin chi tiết
        UserResponse userInfo = userService.getMyInfo(username);

        // 3. Trả về JSON (Không có mật khẩu)
        return ResponseEntity.ok(userInfo);
    }
}