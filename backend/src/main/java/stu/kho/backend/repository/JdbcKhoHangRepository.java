package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.KhoHang;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcKhoHangRepository implements KhoHangRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<KhoHang> khoHangRowMapper = (rs, rowNum) -> {
        KhoHang kho = new KhoHang();
        kho.setMaKho(rs.getInt("MaKho"));
        kho.setTenKho(rs.getString("TenKho"));
        kho.setDiaChi(rs.getString("DiaChi"));
        kho.setGhiChu(rs.getString("GhiChu"));
        return kho;
    };

    public JdbcKhoHangRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<KhoHang> findById(Integer id) {
        String sql = "SELECT * FROM khohang WHERE MaKho = ?";
        try {
            KhoHang kho = jdbcTemplate.queryForObject(sql, khoHangRowMapper, id);
            return Optional.ofNullable(kho);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<KhoHang> findAll() {
        String sql = "SELECT * FROM khohang";
        return jdbcTemplate.query(sql, khoHangRowMapper);
    }
}