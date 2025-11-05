package stu.kho.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final int jwtExpirationMs;
    private final NguoiDungRepository nguoiDungRepository; // Cần inject thêm Repository
    private final VaiTroRepository vaiTroRepository; // Cần inject thêm Repository

    // Sửa lỗi: Inject giá trị và khởi tạo SecretKey ngay trong constructor
    public JwtTokenProvider(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration-ms}") int jwtExpirationMs, NguoiDungRepository nguoiDungRepository, VaiTroRepository vaiTroRepository) {

        this.jwtExpirationMs = jwtExpirationMs;
        this.nguoiDungRepository = nguoiDungRepository;
        this.vaiTroRepository = vaiTroRepository;

        // FIX: Giải mã chuỗi Base64 thành byte array an toàn
        try {
            byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
            this.key = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            // Trường hợp chuỗi Base64 bị lỗi, ném lỗi rõ ràng hơn
            throw new RuntimeException("Lỗi cấu hình JWT Secret: Chuỗi Base64 không hợp lệ.", e);
        }
    }

    public String generateToken(Authentication authentication) {
        NguoiDung userPrincipal = (NguoiDung) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        List<String> roles = nguoiDungRepository.getUserRolesByUsername(userPrincipal.getUsername());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("roles", roles) // <-- THÊM ROLE VÀO TOKEN
                .setIssuedAt(now)
                .setExpiration(expiryDate)
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