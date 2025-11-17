package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JdbcNccSanPhamRepository implements NccSanPhamRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcNccSanPhamRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public int linkNccToSanPham(Integer maNCC, Integer maSP) {
        String sql = "INSERT INTO NCC_SanPham (MaNCC, MaSP) VALUES (?, ?)";
        return jdbcTemplate.update(sql, maNCC, maSP);
    }

    @Override
    public int unlinkNccFromSanPham(Integer maNCC, Integer maSP) {
        String sql = "DELETE FROM NCC_SanPham WHERE MaNCC = ? AND MaSP = ?";
        return jdbcTemplate.update(sql, maNCC, maSP);
    }

    @Override
    public List<Integer> findNccIdsByMaSP(Integer maSP) {
        String sql = "SELECT MaNCC FROM NCC_SanPham WHERE MaSP = ?";
        return jdbcTemplate.queryForList(sql, Integer.class, maSP);
    }
}