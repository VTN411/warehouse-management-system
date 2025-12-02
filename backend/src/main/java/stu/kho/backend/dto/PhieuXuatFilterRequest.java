package stu.kho.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PhieuXuatFilterRequest {
    private String chungTu;
    private Integer trangThai;
    private Integer maKho;
    private Integer maKH;         // Lọc theo khách hàng
    private LocalDate fromDate;
    private LocalDate toDate;
}