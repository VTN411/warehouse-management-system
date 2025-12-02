package stu.kho.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SanPhamFilterRequest {
    private String keyword;       // Tìm theo tên (gần đúng)
    private Integer maLoai;       // Tìm theo loại (chính xác)
    private BigDecimal minGia;    // Giá thấp nhất
    private BigDecimal maxGia;    // Giá cao nhất
}