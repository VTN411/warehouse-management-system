package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.ChiTietDieuChuyen;
import java.util.List;

@Repository
public class JdbcChiTietDieuChuyenRepository implements ChiTietDieuChuyenRepository {

    private final JdbcTemplate jdbcTemplate;
    private final SanPhamRepository sanPhamRepository;

    public JdbcChiTietDieuChuyenRepository(JdbcTemplate jdbcTemplate, SanPhamRepository sanPhamRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.sanPhamRepository = sanPhamRepository;
    }

    @Override
    public void save(ChiTietDieuChuyen ct) {
        String sql = "INSERT INTO chitietdieuchuyen (MaPhieuDC, MaSP, SoLuong) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, ct.getMaPhieuDC(), ct.getMaSP(), ct.getSoLuong());
    }

    @Override
    public List<ChiTietDieuChuyen> findByMaPhieuDC(Integer maPhieuDC) {
        String sql = "SELECT * FROM chitietdieuchuyen WHERE MaPhieuDC = ?";

        RowMapper<ChiTietDieuChuyen> mapper = (rs, rowNum) -> {
            ChiTietDieuChuyen ct = new ChiTietDieuChuyen();
            ct.setMaPhieuDC(rs.getInt("MaPhieuDC"));
            ct.setMaSP(rs.getInt("MaSP"));
            ct.setSoLuong(rs.getInt("SoLuong"));

            // JOIN để lấy tên sản phẩm
            ct.setSanPham(sanPhamRepository.findById(ct.getMaSP()).orElse(null));
            return ct;
        };

        return jdbcTemplate.query(sql, mapper, maPhieuDC);
    }

    @Override
    public void deleteByMaPhieuDC(Integer maPhieuDC) {
        String sql = "DELETE FROM chitietdieuchuyen WHERE MaPhieuDC = ?";
        jdbcTemplate.update(sql, maPhieuDC);
    }
}