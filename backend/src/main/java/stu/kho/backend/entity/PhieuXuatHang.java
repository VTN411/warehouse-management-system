package stu.kho.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhieuXuatHang {
    private Integer maPhieuXuat;
    private LocalDateTime ngayLapPhieu;
    private Integer trangThai; // 1, 2, 3
    private BigDecimal tongTien;
    private Integer maKH;
    private Integer maKho;
    private Integer nguoiLap;
    private Integer nguoiDuyet;
    private String chungTu;

    // Đối tượng liên quan
    private KhachHang khachHang; // (Cần tạo POJO KhachHang nếu chưa có)
    private KhoHang khoHang;
    private NguoiDung nguoiLapObj;
    private List<ChiTietPhieuXuat> chiTiet;
}