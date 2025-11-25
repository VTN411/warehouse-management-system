package stu.kho.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
public class ChiTietDieuChuyen {
    @JsonIgnore
    private Integer maPhieuDC;
    private Integer maSP;
    private Integer soLuong;

    private SanPham sanPham;
}