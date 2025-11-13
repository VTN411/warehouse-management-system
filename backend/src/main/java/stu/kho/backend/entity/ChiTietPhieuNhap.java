package stu.kho.backend.entity;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChiTietPhieuNhap {
    // Khóa chính tổng hợp
    private Integer maPhieuNhap;
    private Integer maSP;

    // Thuộc tính
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien; // Bạn có thể bỏ qua nếu tính toán

    // Đối tượng liên quan
    private SanPham sanPham;
}