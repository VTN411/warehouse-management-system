package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.LoaiHang;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcLoaiHangRepository implements LoaiHangRepository {

    private final JdbcTemplate jdbcTemplate;

    // RowMapper để ánh xạ
    private final RowMapper<LoaiHang> loaiHangRowMapper = (rs, rowNum) -> {
        LoaiHang loai = new LoaiHang();
        loai.setMaLoai(rs.getInt("MaLoai"));
        loai.setTenLoai(rs.getString("TenLoai"));
        loai.setMoTa(rs.getString("MoTa"));
        return loai;
    };

    public JdbcLoaiHangRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<LoaiHang> findById(Integer id) {
        String sql = "SELECT * FROM loaihang WHERE MaLoai = ?";
        try {
            LoaiHang loai = jdbcTemplate.queryForObject(sql, loaiHangRowMapper, id);
            return Optional.ofNullable(loai);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<LoaiHang> findAll() {
        String sql = "SELECT * FROM loaihang";
        return jdbcTemplate.query(sql, loaiHangRowMapper);
    }
}