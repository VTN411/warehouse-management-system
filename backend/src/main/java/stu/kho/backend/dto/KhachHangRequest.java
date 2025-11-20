package stu.kho.backend.dto;

import lombok.Data;

@Data
public class KhachHangRequest {
    private String tenKH;
    private String sdt;
    private String diaChi;
    private String email;
}