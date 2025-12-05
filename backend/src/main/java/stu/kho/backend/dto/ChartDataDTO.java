package stu.kho.backend.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChartDataDTO {
    private String thang; // VD: "01/2025"
    private BigDecimal nhap;
    private BigDecimal xuat;
}