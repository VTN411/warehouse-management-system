package stu.kho.backend.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Integer maNguoiDung;
    private String tenDangNhap;
    private String hoTen;
    private String email;
    private String sdt;
    private String tenVaiTro; // Chỉ trả về tên vai trò (VD: ADMIN)
}