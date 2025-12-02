package stu.kho.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PhieuNhapFilterRequest {
    private String chungTu;       // Tìm theo mã (gần đúng)
    private Integer trangThai;    // 1, 2, 3
    private Integer maKho;        // Lọc theo kho
    private Integer maNCC;        // Lọc theo nhà cung cấp
    private LocalDate fromDate;   // Từ ngày
    private LocalDate toDate;     // Đến ngày
}