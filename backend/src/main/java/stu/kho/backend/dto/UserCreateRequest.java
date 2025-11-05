package stu.kho.backend.dto;

import lombok.Data;

@Data
public class UserCreateRequest {
    private String tenDangNhap;
    private String matKhau;
    private String hoTen;
    private String email;
    private String sdt;
    // Admin sẽ chỉ định MaVaiTro cho user mới
    private Integer maVaiTro;
}