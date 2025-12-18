package stu.kho.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import stu.kho.backend.store.InMemoryTokenStore;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired private InMemoryTokenStore tokenStore;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JavaMailSender mailSender;
    @Autowired private PasswordEncoder passwordEncoder;

    // Email đã xác thực trên SendGrid (BẮT BUỘC PHẢI KHAI BÁO)
    private final String FROM_EMAIL = "email_da_verify_cua_ban@gmail.com";

    public String processForgotPassword(String email, String siteUrl) {
        // 1. Check DB xem email có tồn tại không
        String sql = "SELECT COUNT(*) FROM nguoidung WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        if (count == null || count == 0) return "Email không tồn tại!";

        // 2. Tạo token lưu RAM
        String token = UUID.randomUUID().toString();
        tokenStore.saveToken(token, email);

        // 3. Gửi mail
        String link = siteUrl + "/reset-password?token=" + token;
        sendEmail(email, link);
        return "success";
    }

    public String processResetPassword(String token, String newPass) {
        String emailOrStatus = tokenStore.validateToken(token);
        if ("invalid".equals(emailOrStatus)) return "Link sai!";
        if ("expired".equals(emailOrStatus)) return "Link hết hạn!";

        // Update mật khẩu mới vào DB
        String encodedPass = passwordEncoder.encode(newPass);
        jdbcTemplate.update("UPDATE nguoidung SET matkhau = ? WHERE email = ?", encodedPass, emailOrStatus);

        tokenStore.removeToken(token);
        return "success";
    }

    private void sendEmail(String to, String link) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(FROM_EMAIL); // Quan trọng với SendGrid
        msg.setTo(to);
        msg.setSubject("Đặt lại mật khẩu");
        msg.setText("Bấm vào đây để đổi mật khẩu: " + link);
        mailSender.send(msg);
    }
}