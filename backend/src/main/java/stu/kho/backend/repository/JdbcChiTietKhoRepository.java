package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.SanPhamTrongKhoResponse;
import stu.kho.backend.entity.ChiTietKho;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcChiTietKhoRepository implements ChiTietKhoRepository {

    private final JdbcTemplate jdbcTemplate;
    // Inject các repo khác nếu cần JOIN (ví dụ: SanPhamRepository)
    // ...

    private final RowMapper<ChiTietKho> chiTietKhoRowMapper;

    public JdbcChiTietKhoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.chiTietKhoRowMapper = (rs, rowNum) -> {
            ChiTietKho ctk = new ChiTietKho();
            ctk.setMaSP(rs.getInt("MaSP"));
            ctk.setMaKho(rs.getInt("MaKho"));
            ctk.setSoLuongTon(rs.getInt("SoLuongTon"));

            if (rs.getDate("NgayHetHan") != null) {
                ctk.setNgayHetHan(rs.getDate("NgayHetHan").toLocalDate());
            }
            ctk.setSoLo(rs.getString("SoLo"));

            // (Thêm logic JOIN để lấy SanPham và KhoHang nếu cần)
            return ctk;
        };
    }

    @Override
    public Optional<ChiTietKho> findById(Integer maSP, Integer maKho) {
        String sql = "SELECT * FROM chitietkho WHERE MaSP = ? AND MaKho = ?";
        try {
            ChiTietKho ctk = jdbcTemplate.queryForObject(sql, chiTietKhoRowMapper, maSP, maKho);
            return Optional.ofNullable(ctk);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public int updateSoLuongTon(Integer maSP, Integer maKho, int soLuongMoi) {
        String sql = "UPDATE chitietkho SET SoLuongTon = ? WHERE MaSP = ? AND MaKho = ?";
        return jdbcTemplate.update(sql, soLuongMoi, maSP, maKho);
    }

    @Override
    public int save(ChiTietKho chiTietKho) {
        String sql = "INSERT INTO chitietkho (MaSP, MaKho, SoLuongTon, NgayHetHan, SoLo) VALUES (?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                chiTietKho.getMaSP(),
                chiTietKho.getMaKho(),
                chiTietKho.getSoLuongTon(),
                chiTietKho.getNgayHetHan(),
                chiTietKho.getSoLo()
        );
    }
    @Override
    public List<SanPhamTrongKhoResponse> findSanPhamByMaKho(Integer maKho) {
        String sql = "SELECT sp.MaSP, sp.TenSP, sp.DonViTinh, sp.HinhAnh, sp.GiaNhap, ctk.SoLuongTon " +
                "FROM chitietkho ctk " +
                "JOIN sanpham sp ON ctk.MaSP = sp.MaSP " +
                "WHERE ctk.MaKho = ?";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            SanPhamTrongKhoResponse dto = new SanPhamTrongKhoResponse();
            dto.setMaSP(rs.getInt("MaSP"));
            dto.setTenSP(rs.getString("TenSP"));
            dto.setDonViTinh(rs.getString("DonViTinh"));
            dto.setHinhAnh(rs.getString("HinhAnh"));
            dto.setGiaNhap(rs.getBigDecimal("GiaNhap"));
            dto.setSoLuongTon(rs.getInt("SoLuongTon"));
            return dto;
        }, maKho);
    }
}