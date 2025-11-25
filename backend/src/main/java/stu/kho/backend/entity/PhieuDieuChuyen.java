package stu.kho.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhieuDieuChuyen {
    private Integer maPhieuDC;
    private Integer maKhoXuat;
    private Integer maKhoNhap;
    private LocalDateTime ngayChuyen;
    private Integer trangThai; // 1, 2, 3
    private Integer nguoiLap;
    private Integer nguoiDuyet;
    private String ghiChu;
    private String chungTu;

    // Object liên quan
    private KhoHang khoXuat;
    private KhoHang khoNhap;
    private NguoiDung nguoiLapObj;
    private List<ChiTietDieuChuyen> chiTiet;
}