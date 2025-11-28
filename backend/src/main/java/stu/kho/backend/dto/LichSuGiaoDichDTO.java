package stu.kho.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LichSuGiaoDichDTO {
    private String maGiaoDich;    // VD: "PN-10-1"
    private LocalDateTime ngay;   // Thời gian
    private String loaiGiaoDich;  // "NHAP" hoặc "XUAT"
    private String chungTu;       // VD: "HD-001"
    private String tenSP;
    private String tenKho;
    private Integer soLuong;
}