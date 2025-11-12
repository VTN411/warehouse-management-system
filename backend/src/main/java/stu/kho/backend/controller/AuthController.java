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
@CrossOrigin(origins = "*")
public class AuthController {
    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthController(
            AuthenticationManager authenticationManager,
            NguoiDungRepository nguoiDungRepository,
            VaiTroRepository vaiTroRepository,
            PasswordEncoder passwordEncoder, NguoiDungRepository nguoiDungRepository1, VaiTroRepository vaiTroRepository1, PasswordEncoder passwordEncoder1,
            JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.nguoiDungRepository = nguoiDungRepository1;
        this.vaiTroRepository = vaiTroRepository1;
        this.passwordEncoder = passwordEncoder1;
        this.tokenProvider = tokenProvider;
    }

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        // 1. Xác thực người dùng
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getTenDangNhap(),
                        loginRequest.getMatKhau()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {

        // 1. Kiểm tra Tên đăng nhập
        if (nguoiDungRepository.existsByTenDangNhap(registerRequest.getTenDangNhap())) {
            return ResponseEntity.badRequest().body("Tên đăng nhập đã được sử dụng!");
        }

        // 2. Tìm Vai Trò
        VaiTro vaiTro = vaiTroRepository.findById(registerRequest.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy vai trò."));

        // 3. Tạo User mới
        NguoiDung nguoiDung = new NguoiDung();
        nguoiDung.setTenDangNhap(registerRequest.getTenDangNhap());
        // Mã hóa mật khẩu (FIX LỖI 401)
        nguoiDung.setMatKhau(passwordEncoder.encode(registerRequest.getMatKhau()));
        nguoiDung.setHoTen(registerRequest.getHoTen());
        nguoiDung.setEmail(registerRequest.getEmail());
        nguoiDung.setSdt(registerRequest.getSdt());
        nguoiDung.setVaiTro(vaiTro);

        // 4. Lưu vào DB
        nguoiDungRepository.save(nguoiDung);

        return ResponseEntity.ok("Đăng ký người dùng thành công!");
    }

}