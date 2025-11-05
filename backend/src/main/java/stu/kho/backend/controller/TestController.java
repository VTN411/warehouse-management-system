// Ví dụ: TestController.java
package stu.kho.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// Trong TestController.java
@RestController
@RequestMapping("/api/test")
public class TestController {
    @GetMapping("/secure")
    public String getProtectedResource() {
        return "Truy cập thành công tài nguyên được bảo vệ!";
    }
}