package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class JdbcDashboardRepository implements DashboardRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcDashboardRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1. API Tổng quan (Stats)
    public DashboardStatsDTO getStats(LocalDate from, LocalDate to) {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        // Tổng Vốn Nhập (TrangThai=2: Đã duyệt)
        String sqlNhap = "SELECT COALESCE(SUM(TongTien), 0) FROM phieunhaphang WHERE TrangThai = 2 AND NgayLapPhieu BETWEEN ? AND ?";
        dto.setTongVonNhap(jdbcTemplate.queryForObject(sqlNhap, BigDecimal.class, from, to));

        // Tổng Doanh Thu Xuất
        String sqlXuat = "SELECT COALESCE(SUM(TongTien), 0) FROM phieuxuathang WHERE TrangThai = 2 AND NgayLapPhieu BETWEEN ? AND ?";
        dto.setTongDoanhThuXuat(jdbcTemplate.queryForObject(sqlXuat, BigDecimal.class, from, to));

        // Lợi Nhuận
        dto.setLoiNhuanUocTinh(dto.getTongDoanhThuXuat().subtract(dto.getTongVonNhap()));

        // Tổng Tồn Kho & Giá Trị Tồn (Lấy toàn bộ hiện tại, không theo ngày)
        String sqlTon = "SELECT COALESCE(SUM(SoLuongTon), 0) FROM sanpham";
        dto.setTongTonKho(jdbcTemplate.queryForObject(sqlTon, Integer.class));

        // Giá trị tồn = Sum(SoLuong * GiaNhap)
        String sqlGiaTri = "SELECT COALESCE(SUM(SoLuongTon * GiaNhap), 0) FROM sanpham";
        dto.setGiaTriTonKho(jdbcTemplate.queryForObject(sqlGiaTri, BigDecimal.class));

        // Số đơn chờ duyệt (TrangThai=1)
        String sqlChoDuyet = "SELECT (SELECT COUNT(*) FROM phieunhaphang WHERE TrangThai=1) + (SELECT COUNT(*) FROM phieuxuathang WHERE TrangThai=1)";
        dto.setSoDonChoDuyet(jdbcTemplate.queryForObject(sqlChoDuyet, Integer.class));

        return dto;
    }

    // 2. API Chart (Biểu đồ)
    public List<ChartDataDTO> getChartData(int year) {
        // Query gộp Nhập và Xuất theo tháng
        String sql = """
            SELECT 
                m.month_num,
                COALESCE(SUM(nhap.TongTien), 0) as TongNhap,
                COALESCE(SUM(xuat.TongTien), 0) as TongXuat
            FROM 
                (SELECT 1 as month_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 
                 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) as m
            LEFT JOIN phieunhaphang nhap ON MONTH(nhap.NgayLapPhieu) = m.month_num AND YEAR(nhap.NgayLapPhieu) = ? AND nhap.TrangThai = 2
            LEFT JOIN phieuxuathang xuat ON MONTH(xuat.NgayLapPhieu) = m.month_num AND YEAR(xuat.NgayLapPhieu) = ? AND xuat.TrangThai = 2
            GROUP BY m.month_num
            ORDER BY m.month_num
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ChartDataDTO dto = new ChartDataDTO();
            dto.setThang(String.format("%02d/%d", rs.getInt("month_num"), year));
            dto.setNhap(rs.getBigDecimal("TongNhap"));
            dto.setXuat(rs.getBigDecimal("TongXuat"));
            return dto;
        }, year, year);
    }

    // 3. API Top Sản Phẩm
    public List<TopProductDTO> getTopProducts(String type, int limit, LocalDate from, LocalDate to) {
        String tableDetail = type.equals("import") ? "chitietphieunhap" : "chitietphieuxuat";
        String tableMaster = type.equals("import") ? "phieunhaphang" : "phieuxuathang";
        String idCol = type.equals("import") ? "MaPhieuNhap" : "MaPhieuXuat";

        String sql = String.format("""
            SELECT sp.MaSP, sp.TenSP, SUM(ct.SoLuong) as TongSoLuong, SUM(ct.ThanhTien) as TongGiaTri
            FROM %s ct
            JOIN %s master ON ct.%s = master.%s
            JOIN sanpham sp ON ct.MaSP = sp.MaSP
            WHERE master.TrangThai = 2 AND master.NgayLapPhieu BETWEEN ? AND ?
            GROUP BY sp.MaSP, sp.TenSP
            ORDER BY TongSoLuong DESC
            LIMIT ?
        """, tableDetail, tableMaster, idCol, idCol);

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            TopProductDTO dto = new TopProductDTO();
            dto.setMaSP(rs.getInt("MaSP"));
            dto.setTenSP(rs.getString("TenSP"));
            dto.setTongSoLuong(rs.getInt("TongSoLuong"));
            dto.setTongGiaTri(rs.getBigDecimal("TongGiaTri"));
            return dto;
        }, from, to, limit);
    }

    // 4. API Cảnh báo
    public DashboardAlertsDTO getAlerts() {
        DashboardAlertsDTO alerts = new DashboardAlertsDTO();

        // Sắp hết hàng
        String sqlLow = "SELECT MaSP, TenSP, SoLuongTon, MucTonToiThieu FROM sanpham WHERE SoLuongTon <= MucTonToiThieu";
        alerts.setSapHetHang(jdbcTemplate.query(sqlLow, (rs, rowNum) -> {
            DashboardAlertsDTO.SapHetHang item = new DashboardAlertsDTO.SapHetHang();
            item.setMaSP(rs.getInt("MaSP"));
            item.setTenSP(rs.getString("TenSP"));
            item.setTonHienTai(rs.getInt("SoLuongTon"));
            item.setMucToiThieu(rs.getInt("MucTonToiThieu"));
            return item;
        }));

        // Hết hạn sử dụng (Nếu có dùng bảng ChiTietKho và cột NgayHetHan)
        // Giả sử lấy những lô hết hạn trong 7 ngày tới
        String sqlExpire = "SELECT ctk.MaSP, sp.TenSP, ctk.SoLo, ctk.NgayHetHan, ctk.MaKho " +
                "FROM chitietkho ctk JOIN sanpham sp ON ctk.MaSP = sp.MaSP " +
                "WHERE ctk.NgayHetHan IS NOT NULL AND ctk.NgayHetHan <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
        alerts.setHetHanSuDung(jdbcTemplate.query(sqlExpire, (rs, rowNum) -> {
            DashboardAlertsDTO.HetHanSuDung item = new DashboardAlertsDTO.HetHanSuDung();
            item.setMaSP(rs.getInt("MaSP"));
            item.setTenSP(rs.getString("TenSP"));
            item.setSoLo(rs.getString("SoLo"));
            item.setNgayHetHan(rs.getDate("NgayHetHan").toLocalDate());
            item.setMaKho(rs.getInt("MaKho"));
            return item;
        }));

        return alerts;
    }

    // 5. Báo cáo NXT Chi tiết (Logic khó nhất)
    public List<BaoCaoNxtDTO> getBaoCaoNXT(LocalDate from, LocalDate to) {
        // Cách tính:
        // 1. Lấy tất cả sản phẩm.
        // 2. Tính tổng nhập/xuất TRƯỚC kỳ (để ra tồn đầu).
        // 3. Tính tổng nhập/xuất TRONG kỳ.

        // Lưu ý: Đây là query nặng, có thể tối ưu bằng Store Procedure hoặc View trong tương lai.
        String sql = """
            SELECT 
                sp.MaSP, sp.TenSP, sp.DonViTinh, sp.GiaNhap,
                
                -- Tồn đầu = Tổng Nhập (Trước From) - Tổng Xuất (Trước From)
                (COALESCE((SELECT SUM(ctn.SoLuong) 
                   FROM chitietphieunhap ctn JOIN phieunhaphang pn ON ctn.MaPhieuNhap = pn.MaPhieuNhap 
                   WHERE ctn.MaSP = sp.MaSP AND pn.TrangThai = 2 AND pn.NgayLapPhieu < ?), 0) 
                 - 
                 COALESCE((SELECT SUM(ctx.SoLuong) 
                   FROM chitietphieuxuat ctx JOIN phieuxuathang px ON ctx.MaPhieuXuat = px.MaPhieuXuat 
                   WHERE ctx.MaSP = sp.MaSP AND px.TrangThai = 2 AND px.NgayLapPhieu < ?), 0)
                ) as TonDau,
                
                -- Nhập trong kỳ
                COALESCE((SELECT SUM(ctn.SoLuong) 
                   FROM chitietphieunhap ctn JOIN phieunhaphang pn ON ctn.MaPhieuNhap = pn.MaPhieuNhap 
                   WHERE ctn.MaSP = sp.MaSP AND pn.TrangThai = 2 AND pn.NgayLapPhieu BETWEEN ? AND ?), 0) as SlNhap,
                   
                -- Xuất trong kỳ
                COALESCE((SELECT SUM(ctx.SoLuong) 
                   FROM chitietphieuxuat ctx JOIN phieuxuathang px ON ctx.MaPhieuXuat = px.MaPhieuXuat 
                   WHERE ctx.MaSP = sp.MaSP AND px.TrangThai = 2 AND px.NgayLapPhieu BETWEEN ? AND ?), 0) as SlXuat

            FROM sanpham sp
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            BaoCaoNxtDTO dto = new BaoCaoNxtDTO();
            dto.setMaSP(rs.getInt("MaSP"));
            dto.setTenSP(rs.getString("TenSP"));
            dto.setDonViTinh(rs.getString("DonViTinh"));
            dto.setTonDau(rs.getInt("TonDau"));
            dto.setSlNhap(rs.getInt("SlNhap"));
            dto.setSlXuat(rs.getInt("SlXuat"));

            // Tính tồn cuối
            dto.setTonCuoi(dto.getTonDau() + dto.getSlNhap() - dto.getSlXuat());

            // Tính giá trị
            BigDecimal giaNhap = rs.getBigDecimal("GiaNhap");
            if (giaNhap != null) {
                dto.setGiaTriTonCuoi(giaNhap.multiply(new BigDecimal(dto.getTonCuoi())));
            } else {
                dto.setGiaTriTonCuoi(BigDecimal.ZERO);
            }
            return dto;
        }, from, from, from, to, from, to);
    }
}