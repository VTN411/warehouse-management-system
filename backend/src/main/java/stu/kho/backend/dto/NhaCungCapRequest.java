package stu.kho.backend.dto;

import lombok.Data;

@Data
public class NhaCungCapRequest {
    private String tenNCC;
    private String nguoiLienHe;
    private String sdt;
    private String diaChi;
    private String email;
}