package stu.kho.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final int jwtExpirationMs;
    public JwtTokenProvider(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration-ms}") int jwtExpirationMs) {

        this.jwtExpirationMs = jwtExpirationMs;
        try {
            byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
            this.key = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Lỗi cấu hình JWT Secret: Chuỗi Base64 không hợp lệ.", e);
        }
    }

    // Phương thức generateToken của bạn đã TỐT (giữ nguyên)
    public String generateToken(Authentication authentication) {
        NguoiDung userPrincipal = (NguoiDung) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        // Lấy quyền từ user đã được xác thực (tải từ DB lúc login)
        List<String> authorities = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("authorities", authorities) // Thêm quyền vào Token
                .signWith(this.key, SignatureAlgorithm.HS512)
                .compact();
    }
    // 2. Lấy Tên đăng nhập từ token
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(this.key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }
    public List<String> getAuthoritiesFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(this.key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("authorities", List.class);
    }

    // 3. Kiem tra token co hop le
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(this.key).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            // Log lỗi (ví dụ: token hết hạn, chữ ký sai)
            return false;
        }
    }
}