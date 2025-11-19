package stu.kho.backend.entity;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChiTietPhieuXuat {
    private Integer maPhieuXuat;
    private Integer maSP;
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien;

    private SanPham sanPham;
}