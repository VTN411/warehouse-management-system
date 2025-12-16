package stu.kho.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserResponse {
    private Integer maNguoiDung;
    private String tenDangNhap;
    private String hoTen;
    private String email;
    private String sdt;
    private String tenVaiTro;
    private Boolean trangThai;
    private List<Integer> dsQuyenSoHuu;
}