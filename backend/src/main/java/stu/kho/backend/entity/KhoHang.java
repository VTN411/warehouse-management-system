package stu.kho.backend.entity;

import lombok.Data;

@Data // Chỉ cần Lombok
public class KhoHang {

    private Integer maKho;
    private String tenKho;
    private String diaChi;
    private String ghiChu;
}