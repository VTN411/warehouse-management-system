package stu.kho.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller; // Sửa import này
import org.springframework.ui.Model; // Thêm import này
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.JwtAuthenticationResponse;
import stu.kho.backend.dto.LoginRequest;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;
import stu.kho.backend.security.JwtTokenProvider;
import stu.kho.backend.service.PasswordResetService; // Import Service

@Controller // 1. Đổi từ RestController sang Controller để trả về HTML
// Lưu ý: Nếu để @RequestMapping("/api/auth") ở đây, thì link quên mật khẩu sẽ là /api/auth/forgot-password
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final PasswordResetService resetService; // 2. Khai báo Service

    // 3. Sửa lại Constructor cho gọn và đủ
    public AuthController(
            AuthenticationManager authenticationManager,
            NguoiDungRepository nguoiDungRepository,
            VaiTroRepository vaiTroRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            PasswordResetService resetService) { // Inject Service vào đây
        this.authenticationManager = authenticationManager;
        this.nguoiDungRepository = nguoiDungRepository;
        this.vaiTroRepository = vaiTroRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.resetService = resetService;
    }

    // === API ĐĂNG NHẬP (Trả về JSON) ===
    @PostMapping("/api/auth/login") // Định nghĩa rõ đường dẫn API
    @ResponseBody // 4. Bắt buộc có dòng này để trả về JSON thay vì tìm file HTML
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
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

    // === MODULE QUÊN MẬT KHẨU (Trả về Giao diện HTML) ===

    // Trang nhập Email
    @GetMapping("/forgot-password")
    public String forgotPassPage() {
        return "auth/forgot-password"; // Trả về file forgot-password.html
    }

    // Xử lý gửi mail
    @PostMapping("/forgot-password")
    public String processForgot(HttpServletRequest request, @RequestParam("email") String email, Model model) {
        String url = request.getRequestURL().toString().replace(request.getServletPath(), "");
        String result = resetService.processForgotPassword(email, url);

        if ("success".equals(result)) {
            model.addAttribute("message", "Đã gửi link vào email của bạn.");
        } else {
            model.addAttribute("error", result);
        }
        return "auth/forgot-password";
    }

    // Trang nhập mật khẩu mới (từ link email)
    @GetMapping("/reset-password")
    public String resetPassPage(@RequestParam(value="token", required=false) String token, Model model) {
        if (token == null) {
            model.addAttribute("error", "Token thiếu!");
        }
        model.addAttribute("token", token);
        return "auth/reset-password"; // Trả về file reset-password.html
    }

    // Xử lý đổi mật khẩu
    @PostMapping("/reset-password")
    public String processReset(@RequestParam("token") String token, @RequestParam("password") String pass, Model model) {
        String result = resetService.processResetPassword(token, pass);
        if ("success".equals(result)) {
            // Chuyển hướng về trang login (Lưu ý: Bạn cần có trang login.html hoặc đường dẫn frontend tương ứng)
            return "redirect:/login?resetSuccess";
        }
        model.addAttribute("error", result);
        return "auth/reset-password";
    }
}