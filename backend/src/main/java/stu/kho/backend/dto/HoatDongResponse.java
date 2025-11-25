package stu.kho.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HoatDongResponse {
    private Integer maHD;
    private String tenDangNhap; // Hiển thị tên thay vì ID
    private String hoTen;       // Hiển thị họ tên
    private String hanhDong;
    private LocalDateTime thoiGianThucHien;
}