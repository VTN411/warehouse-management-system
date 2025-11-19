package stu.kho.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SanPhamRequest {
    private String tenSP;
    private String donViTinh;
    private BigDecimal giaNhap;
    private Integer mucTonToiThieu;
    private Integer mucTonToiDa;

    // Khóa ngoại
    private Integer maLoai;

    // Danh sách ID nhà cung cấp (cho quan hệ N:M)
    private List<Integer> danhSachMaNCC;
}