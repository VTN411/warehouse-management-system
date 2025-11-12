package stu.kho.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    // Phương thức này xử lý các lỗi XÁC THỰC (401 Unauthorized)
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // Thiết lập phản hồi JSON cho lỗi 401
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // Mã 401

        String message = "{\"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Yêu cầu xác thực. Vui lòng đăng nhập.\"";

        response.getWriter().write(message);
    }

}