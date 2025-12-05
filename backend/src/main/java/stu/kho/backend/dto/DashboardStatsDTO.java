package stu.kho.backend.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class DashboardStatsDTO {
    private BigDecimal tongVonNhap;
    private BigDecimal tongDoanhThuXuat;
    private BigDecimal loiNhuanUocTinh;
    private Integer tongTonKho;
    private BigDecimal giaTriTonKho;
    private Integer soDonChoDuyet;
}