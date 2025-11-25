package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.BaoCaoTonKhoDTO;

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
}