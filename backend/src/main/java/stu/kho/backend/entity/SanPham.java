package stu.kho.backend.entity;

import lombok.Data;
import java.math.BigDecimal;

@Data // Chỉ cần Lombok
public class SanPham {

    private Integer maSP;
    private String tenSP;
    private String donViTinh;
    private BigDecimal giaNhap;
    private Integer soLuongTon;
    private Integer mucTonToiThieu;
    private Integer mucTonToiDa;

    // --- Khóa Ngoại ---
    private Integer maLoai;
    private Integer maNCC;

    // --- Các đối tượng liên quan (Optional, dùng khi JOIN) ---
    // (Bạn sẽ điền các đối tượng này trong RowMapper)
    private LoaiHang loaiHang;
    private NhaCungCap nhaCungCap;
}