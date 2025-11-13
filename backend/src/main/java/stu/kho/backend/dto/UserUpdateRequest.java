package stu.kho.backend.dto;

import lombok.Data;

// DTO này dùng khi Admin sửa thông tin user
// (Không bao gồm TenDangNhap hoặc MatKhau)
@Data
public class UserUpdateRequest {
    private String hoTen;
    private String email;
    private String sdt;
    private Integer maVaiTro;
}