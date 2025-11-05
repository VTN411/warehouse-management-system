package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.JwtAuthenticationResponse;
import stu.kho.backend.dto.LoginRequest;
import stu.kho.backend.dto.RegisterRequest;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.VaiTro;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;
import stu.kho.backend.security.JwtTokenProvider;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(
            AuthenticationManager authenticationManager,
            NguoiDungRepository nguoiDungRepository,
            VaiTroRepository vaiTroRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.nguoiDungRepository = nguoiDungRepository;
        this.vaiTroRepository = vaiTroRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    // 1. API Đăng nhập (/api/auth/login)
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        // Xác thực người dùng bằng username và password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getTenDangNhap(),
                        loginRequest.getMatKhau()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Tạo JWT Token sau khi xác thực thành công
        String jwt = tokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }

    // 2. API Đăng ký (/api/auth/register)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {

        if (nguoiDungRepository.existsByTenDangNhap(registerRequest.getTenDangNhap())) {
            return ResponseEntity.badRequest().body("Tên đăng nhập đã được sử dụng!");
        }

        NguoiDung nguoiDung = new NguoiDung();
        nguoiDung.setTenDangNhap(registerRequest.getTenDangNhap());
        // Mã hóa mật khẩu trước khi lưu
        nguoiDung.setMatKhau(passwordEncoder.encode(registerRequest.getMatKhau()));
        nguoiDung.setHoTen(registerRequest.getHoTen());
        nguoiDung.setEmail(registerRequest.getEmail());
        nguoiDung.setSdt(registerRequest.getSdt());

        // Lấy VaiTro từ DB (sử dụng Repository)
        VaiTro vaiTro = vaiTroRepository.findById(registerRequest.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với ID: " + registerRequest.getMaVaiTro()));
        nguoiDung.setVaiTro(vaiTro);

        nguoiDungRepository.save(nguoiDung);

        return ResponseEntity.ok("Đăng ký người dùng thành công!");
    }
}