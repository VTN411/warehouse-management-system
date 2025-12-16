package stu.kho.backend.entity;

import lombok.Data;

@Data
public class KhachHang {
    private Integer maKH;
    private String tenKH;
    private String sdt;
    private String diaChi;
    private String email;
    private Boolean daXoa = false; // Mặc định là false (0 - Chưa xóa)

}