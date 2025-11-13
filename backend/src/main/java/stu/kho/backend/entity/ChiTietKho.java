package stu.kho.backend.entity;

import lombok.Data;
import java.time.LocalDate; // Dùng LocalDate cho kiểu DATE

@Data
public class ChiTietKho {
    // Khóa chính tổng hợp
    private Integer maSP;
    private Integer maKho;

    // Thuộc tính
    private Integer soLuongTon;
    private LocalDate ngayHetHan;
    private String soLo;

    // Đối tượng liên quan (Optional)
    private SanPham sanPham;
    private KhoHang khoHang;
}