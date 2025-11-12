package stu.kho.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    // Phương thức này xử lý lỗi PHÂN QUYỀN (403 Forbidden)
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        // Thiết lập phản hồi JSON cho lỗi 403
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN); // Mã 403

        String message = "{\"status\": 403, \"error\": \"Forbidden\", \"message\": \"Truy cập bị từ chối. Bạn không có quyền Admin.\"}";

        response.getWriter().write(message);
    }
}