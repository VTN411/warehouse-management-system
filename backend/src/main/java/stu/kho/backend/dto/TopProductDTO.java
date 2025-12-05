package stu.kho.backend.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TopProductDTO {
    private Integer maSP;
    private String tenSP;
    private Integer tongSoLuong;
    private BigDecimal tongGiaTri;
}