package stu.kho.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common")
@CrossOrigin(origins = "*")

public class CommonController {

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/user-info")
    public String getUserInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        String roles = auth.getAuthorities().toString();

        return "Truy cập thành công! User: " + username + ", Roles: " + roles;
    }
    //Chuc nang chung cua cac role common
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/sanpham/list")
    public String listCommonProducts() {
        return "SUCCESS: Lấy danh sách sản phẩm chung.";
    }
}