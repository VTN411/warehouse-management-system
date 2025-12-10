// Trong file: entity/SanPham.java

package stu.kho.backend.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List; // Import List

@Data
public class SanPham {

    private Integer maSP;
    private String tenSP;
    private String donViTinh;
    private BigDecimal giaNhap;
    private Integer soLuongTon;
    private Integer mucTonToiThieu;
    private Integer mucTonToiDa;
    private Boolean daXoa;
    // --- Khóa Ngoại  ---
    private Integer maLoai;

    private String hinhAnh;
    // --- Các đối tượng liên quan (Optional) ---
    private LoaiHang loaiHang;

    // THÊM TRƯỜNG MỚI (Optional): Danh sách các NCC
    private List<NhaCungCap> danhSachNCC;
}