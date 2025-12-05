package stu.kho.backend.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BaoCaoNxtDTO {
    private Integer maSP;
    private String tenSP;
    private String donViTinh;
    private Integer tonDau;
    private Integer slNhap;
    private Integer slXuat;
    private Integer tonCuoi;
    private BigDecimal giaTriTonCuoi; // Tạm tính theo giá nhập hiện tại
}