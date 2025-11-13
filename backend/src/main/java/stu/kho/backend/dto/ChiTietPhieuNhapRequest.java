package stu.kho.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChiTietPhieuNhapRequest {
    private Integer maSP;
    private Integer soLuong;
    private BigDecimal donGia;
    // ThanhTien sẽ được tính toán ở backend
}