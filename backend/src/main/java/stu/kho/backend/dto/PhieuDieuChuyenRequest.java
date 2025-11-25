package stu.kho.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class PhieuDieuChuyenRequest {
    private Integer maKhoXuat;
    private Integer maKhoNhap;
    private String ghiChu;
    private String chungTu;

    private List<ChiTietDieuChuyenRequest> chiTiet;

    @Data
    public static class ChiTietDieuChuyenRequest {
        private Integer maSP;
        private Integer soLuong;
    }
}