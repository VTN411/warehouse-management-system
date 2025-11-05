package stu.kho.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import stu.kho.backend.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity // Bật tính năng bảo mật web của Spring Security
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Inject JwtAuthenticationFilter (bộ lọc JWT) vào constructor
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // 1. Bean để mã hóa mật khẩu (BCrypt là tiêu chuẩn)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Bean AuthenticationManager (Cần thiết cho quá trình Đăng nhập)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // 3. Cấu hình chuỗi lọc bảo mật (Security Filter Chain)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Tắt CSRF vì chúng ta dùng JWT (stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Không sử dụng session
                .authorizeHttpRequests(authz -> authz
                        // Cho phép tất cả truy cập vào API Auth (Đăng ký, Đăng nhập)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/test/secure").hasRole("ADMIN") // Chỉ Admin được vào
                        // Cho phép truy cập vào các tài nguyên tĩnh (nếu có)
                        .requestMatchers("/static/**").permitAll()
                        // Tất cả các request khác đều phải được xác thực bằng JWT
                        .anyRequest().authenticated()
                );

        // Thêm bộ lọc JWT của chúng ta vào trước bộ lọc xác thực mặc định của Spring
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}