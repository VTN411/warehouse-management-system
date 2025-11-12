package stu.kho.backend.entity;

import lombok.Data;
import java.time.LocalDateTime; // Sử dụng LocalDateTime cho kiểu DATETIME

@Data // Tự động tạo Getter/Setter
public class HoatDong {
    private Integer maHD;
    private Integer maNguoiDung;
    private String hanhDong;
    private LocalDateTime thoiGianThucHien;
}