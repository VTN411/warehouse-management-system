package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcNguoiDungChucNangRepository implements NguoiDungChucNangRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcNguoiDungChucNangRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public int linkUserToChucNang(Integer maNguoiDung, Integer maChucNang) {
        String sql = "INSERT INTO nguoidung_chucnang (MaNguoiDung, MaChucNang) VALUES (?, ?)";
        return jdbcTemplate.update(sql, maNguoiDung, maChucNang);
    }

    @Override
    public int unlinkUserFromChucNang(Integer maNguoiDung, Integer maChucNang) {
        String sql = "DELETE FROM nguoidung_chucnang WHERE MaNguoiDung = ? AND MaChucNang = ?";
        return jdbcTemplate.update(sql, maNguoiDung, maChucNang);
    }
}