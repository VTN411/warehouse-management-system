package stu.kho.backend.entity;

import lombok.Data;

@Data // Chỉ cần Lombok
public class NhaCungCap {

    private Integer maNCC;
    private String tenNCC;
    private String nguoiLienHe;
    private String sdt;
    private String diaChi;
    private String email;
}