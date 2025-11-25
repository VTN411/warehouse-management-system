package stu.kho.backend.dto;

import lombok.Data;

@Data
public class BaoCaoTonKhoDTO {
    private Integer maSP;
    private String tenSP;
    private String donViTinh;
    private String tenKho; // Tên kho đang chứa
    private Integer soLuongTon; // Số lượng thực tế
    private Integer mucTonToiThieu;
    private Integer mucTonToiDa;

    // Trạng thái cảnh báo (VD: "Bình thường", "Sắp hết hàng", "Vượt định mức")
    private String trangThaiCanhBao;
}