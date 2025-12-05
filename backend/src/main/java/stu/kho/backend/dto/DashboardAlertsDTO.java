package stu.kho.backend.dto;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class DashboardAlertsDTO {
    private List<SapHetHang> sapHetHang;
    private List<HetHanSuDung> hetHanSuDung;
    private List<TonAm> tonAm;

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
        private Integer maKho;
    }

    @Data
    public static class TonAm {
        private Integer maSP;
        private String tenSP;
        private Integer maKho;
        private Integer tonHienTai;
    }
}