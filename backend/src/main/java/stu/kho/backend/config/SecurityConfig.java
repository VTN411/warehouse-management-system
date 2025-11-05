package stu.kho.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import stu.kho.backend.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationEntryPoint unauthorizedHandler; // Khai báo
    private final AccessDeniedHandler accessDeniedHandler; //
    // Inject JwtAuthenticationFilter (bộ lọc JWT) vào constructor
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, AuthenticationEntryPoint unauthorizedHandler, AccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.unauthorizedHandler = unauthorizedHandler;
        this.accessDeniedHandler = accessDeniedHandler;
    }

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
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                //cấu hình xử lí lỗi
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(unauthorizedHandler) // Xử lý lỗi 401
                        .accessDeniedHandler(accessDeniedHandler) // Xử lý lỗi 403
                )
                .authorizeHttpRequests(authz -> authz
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/static/**").permitAll()
                                // 2. CẤP QUYỀN ADMIN (Dành cho các tài nguyên quản trị hệ thống)
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                // 3. CẤP QUYỀN THỦ KHO & ADMIN (Dành cho các thao tác kho)
                                .requestMatchers("/api/kho/**").hasAnyRole("ADMIN", "THUKHO")
                                // 4. CẤP QUYỀN CHUNG (Chỉ cần đăng nhập là được truy cập, ví dụ: tra cứu danh mục)
                                .requestMatchers("/api/common/**").authenticated()
                                // Quy tắc cuối cùng: Chặn mọi request khác (nếu không khớp với các quy tắc trên)
                                .anyRequest().denyAll()
                );
        // Thêm bộ lọc JWT của chúng ta vào trước bộ lọc xác thực mặc định của Spring
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}