package stu.kho.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger filterLogger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider tokenProvider;
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Lấy đường dẫn của request (ví dụ: /api/admin/users/7/permissions/30)
        String requestPath = request.getRequestURI();

        // =================================================================
        // === BẪY DEBUG (Chỉ log chi tiết cho API Admin User) ===
        // =================================================================
        boolean isDebugTarget = requestPath.startsWith("/api/admin/users/");

        if (isDebugTarget) {
            filterLogger.info("===== DEBUG TARGET API =====");
            filterLogger.info("Request Path: {}", requestPath);
        }

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {

                if (isDebugTarget) {
                    filterLogger.info("Token nhận được: {}", jwt);
                }

                // Kiểm tra validate (JwtTokenProvider đã có log chi tiết nếu lỗi)
                if (tokenProvider.validateToken(jwt)) {

                    String username = tokenProvider.getUsernameFromJWT(jwt);
                    List<String> authoritiesStrings = tokenProvider.getAuthoritiesFromJWT(jwt);

                    if (isDebugTarget) {
                        filterLogger.info("Token hợp lệ. User: {}. Quyền (từ Token): {}", username, authoritiesStrings);
                    }

                    if (authoritiesStrings == null || authoritiesStrings.isEmpty()) {
                        // Lỗi logic: Token không chứa quyền (lỗi lúc tạo Token)
                        filterLogger.warn("Token hợp lệ nhưng không chứa quyền (authorities) cho user: {}", username);
                        throw new Exception("Token không chứa quyền.");
                    }

                    List<SimpleGrantedAuthority> authorities = authoritiesStrings.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            username, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                } else {
                    if (isDebugTarget) {
                        filterLogger.warn("===== LỖI DEBUG: tokenProvider.validateToken(jwt) trả về FALSE =====");
                    }
                }
            } else {
                if (isDebugTarget) {
                    filterLogger.warn("===== LỖI DEBUG: Không tìm thấy JWT Token trong Header =====");
                }
            }

        } catch (Exception ex) {
            // Lỗi nghiêm trọng (ví dụ: ClassCastException khi đọc quyền)
            filterLogger.error("Lỗi nghiêm trọng trong JwtAuthenticationFilter khi xử lý {}: ", requestPath, ex);
        }

        filterChain.doFilter(request, response);
    }
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}