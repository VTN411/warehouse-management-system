package stu.kho.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChiTietPhieuNhap {

    // 1. Ẩn ID cha
    @JsonIgnore
    private Integer maPhieuNhap;

    private Integer maSP;
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien;

    @JsonIgnoreProperties({
            "danhSachNCC",      // Có thể ẩn nếu không cần thiết
            "mucTonToiThieu",
            "mucTonToiDa",
    })
    private SanPham sanPham;
}