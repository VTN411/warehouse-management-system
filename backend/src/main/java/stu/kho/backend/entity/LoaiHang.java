package stu.kho.backend.entity;

import lombok.Data;

@Data // Chỉ cần Lombok
public class LoaiHang {

    private Integer maLoai;
    private String tenLoai; // Tên cột trong CSDL là TenLoai
    private String moTa;
    private Boolean daXoa = false; // Mặc định là false (0 - Chưa xóa)
}