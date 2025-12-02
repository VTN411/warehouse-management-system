package stu.kho.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PhieuDieuChuyenFilterRequest {
    private String chungTu;
    private Integer trangThai;
    private Integer maKhoXuat;    // Lọc theo kho xuất
    private Integer maKhoNhap;    // Lọc theo kho nhập
    private LocalDate fromDate;
    private LocalDate toDate;
}