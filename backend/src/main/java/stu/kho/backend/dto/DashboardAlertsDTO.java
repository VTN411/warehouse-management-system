package stu.kho.backend.dto;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class DashboardAlertsDTO {
    private List<SapHetHang> sapHetHang;
    private List<HetHanSuDung> hetHanSuDung;
    @Data
    public static class SapHetHang {
        private Integer maSP;
        private String tenSP;
        private Integer tonHienTai;
        private Integer mucToiThieu;
    }

    @Data
    public static class HetHanSuDung {
        private Integer maSP;
        private String tenSP;
        private String soLo;
        private LocalDate ngayHetHan;
        private Integer soLuongTon; // Thêm số lượng để biết lô này còn bao nhiêu
        private Integer maKho;
        private String tenKho;      // Thêm tên kho cho rõ ràng
        private String trangThai;   // "Đã hết hạn" hoặc "Sắp hết hạn"
    }

}