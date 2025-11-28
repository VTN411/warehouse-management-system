package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.BaoCaoTonKhoDTO;
import stu.kho.backend.dto.LichSuGiaoDichDTO;

import java.util.List;

@Repository
public class JdbcBaoCaoRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcBaoCaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // API: Lấy báo cáo tồn kho kèm cảnh báo
    public List<BaoCaoTonKhoDTO> getBaoCaoTonKho() {
        // Câu SQL: JOIN bảng ChiTietKho với SanPham và KhoHang
        String sql = "SELECT sp.MaSP, sp.TenSP, sp.DonViTinh, kh.TenKho, " +
                "ctk.SoLuongTon, sp.MucTonToiThieu, sp.MucTonToiDa " +
                "FROM chitietkho ctk " +
                "JOIN sanpham sp ON ctk.MaSP = sp.MaSP " +
                "JOIN khohang kh ON ctk.MaKho = kh.MaKho " +
                "ORDER BY kh.TenKho, sp.TenSP";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            BaoCaoTonKhoDTO dto = new BaoCaoTonKhoDTO();
            dto.setMaSP(rs.getInt("MaSP"));
            dto.setTenSP(rs.getString("TenSP"));
            dto.setDonViTinh(rs.getString("DonViTinh"));
            dto.setTenKho(rs.getString("TenKho"));
            dto.setSoLuongTon(rs.getInt("SoLuongTon"));
            dto.setMucTonToiThieu(rs.getInt("MucTonToiThieu"));
            dto.setMucTonToiDa(rs.getInt("MucTonToiDa"));

            // --- LOGIC CẢNH BÁO ---
            int ton = dto.getSoLuongTon();
            int min = dto.getMucTonToiThieu();
            int max = dto.getMucTonToiDa();

            if (ton <= min) {
                dto.setTrangThaiCanhBao("WARNING_LOW"); // Cảnh báo thấp
            } else if (max > 0 && ton >= max) {
                dto.setTrangThaiCanhBao("WARNING_HIGH"); // Cảnh báo cao
            } else {
                dto.setTrangThaiCanhBao("NORMAL"); // Bình thường
            }

            return dto;
        });
    }
    public List<LichSuGiaoDichDTO> getLichSuGiaoDich() {

        // SQL cho PHIẾU NHẬP
        String sqlNhap =
                "SELECT " +
                        "  CONCAT('PN-', p.MaPhieuNhap, '-', ct.MaSP) as MaGiaoDich, " +
                        "  p.NgayLapPhieu as Ngay, " +
                        "  'NHAP' as LoaiGiaoDich, " +
                        "  p.ChungTu, " +
                        "  sp.TenSP, " +
                        "  k.TenKho, " +
                        "  ct.SoLuong " +
                        "FROM phieunhaphang p " +
                        "JOIN chitietphieunhap ct ON p.MaPhieuNhap = ct.MaPhieuNhap " +
                        "JOIN sanpham sp ON ct.MaSP = sp.MaSP " +
                        "JOIN khohang k ON p.MaKho = k.MaKho " +
                        "WHERE p.TrangThai = 2 "; // Chỉ lấy phiếu ĐÃ DUYỆT (tùy chọn)

        // SQL cho PHIẾU XUẤT
        String sqlXuat =
                "SELECT " +
                        "  CONCAT('PX-', p.MaPhieuXuat, '-', ct.MaSP) as MaGiaoDich, " +
                        "  p.NgayLapPhieu as Ngay, " +
                        "  'XUAT' as LoaiGiaoDich, " +
                        "  p.ChungTu, " +
                        "  sp.TenSP, " +
                        "  k.TenKho, " +
                        "  ct.SoLuong " +
                        "FROM phieuxuathang p " +
                        "JOIN chitietphieuxuat ct ON p.MaPhieuXuat = ct.MaPhieuXuat " +
                        "JOIN sanpham sp ON ct.MaSP = sp.MaSP " +
                        "JOIN khohang k ON p.MaKho = k.MaKho " +
                        "WHERE p.TrangThai = 2 "; // Chỉ lấy phiếu ĐÃ DUYỆT (tùy chọn)

        // GỘP 2 SQL VÀ SẮP XẾP
        String finalSql = sqlNhap + " UNION ALL " + sqlXuat + " ORDER BY Ngay DESC";

        return jdbcTemplate.query(finalSql, (rs, rowNum) -> {
            LichSuGiaoDichDTO dto = new LichSuGiaoDichDTO();
            dto.setMaGiaoDich(rs.getString("MaGiaoDich"));
            if (rs.getTimestamp("Ngay") != null) {
                dto.setNgay(rs.getTimestamp("Ngay").toLocalDateTime());
            }
            dto.setLoaiGiaoDich(rs.getString("LoaiGiaoDich"));
            dto.setChungTu(rs.getString("ChungTu"));
            dto.setTenSP(rs.getString("TenSP"));
            dto.setTenKho(rs.getString("TenKho"));
            dto.setSoLuong(rs.getInt("SoLuong"));
            return dto;
        });
    }
}