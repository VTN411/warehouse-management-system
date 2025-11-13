package stu.kho.backend.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List; // <-- 1. THÊM IMPORT NÀY

@Data
public class PhieuNhapHang {
    private Integer maPhieuNhap;
    private LocalDateTime ngayLapPhieu;
    private String trangThai;
    private BigDecimal tongTien;
    private Integer maNCC;
    private Integer maKho;
    private Integer nguoiLap;
    private Integer nguoiDuyet;
    private String chungTu;

    // Các đối tượng liên quan (Optional, dùng khi JOIN)
    private NhaCungCap nhaCungCap;
    private KhoHang khoHang;
    private NguoiDung nguoiLapObj;

    // --- 2. THÊM TRƯỜNG MỚI NÀY ---
    // Dùng để lưu danh sách chi tiết khi gọi getPhieuNhapById()
    private List<ChiTietPhieuNhap> chiTiet;
}