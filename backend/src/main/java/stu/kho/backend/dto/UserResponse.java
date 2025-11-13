package stu.kho.backend.dto;

import lombok.Data;

// DTO này dùng để trả về danh sách user, an toàn (không lộ mật khẩu)
@Data
public class UserResponse {
    private Integer maNguoiDung;
    private String tenDangNhap;
    private String hoTen;
    private String email;
    private String sdt;
    private String tenVaiTro; // Trả về tên Vai Trò (thay vì ID)
}