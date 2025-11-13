package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.NhaCungCap;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcNhaCungCapRepository implements NhaCungCapRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<NhaCungCap> nccRowMapper = (rs, rowNum) -> {
        NhaCungCap ncc = new NhaCungCap();
        ncc.setMaNCC(rs.getInt("MaNCC"));
        ncc.setTenNCC(rs.getString("TenNCC"));
        ncc.setNguoiLienHe(rs.getString("NguoiLienHe"));
        ncc.setSdt(rs.getString("SDT"));
        ncc.setDiaChi(rs.getString("DiaChi"));
        ncc.setEmail(rs.getString("Email"));
        return ncc;
    };

    public JdbcNhaCungCapRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<NhaCungCap> findById(Integer id) {
        String sql = "SELECT * FROM nhacungcap WHERE MaNCC = ?";
        try {
            NhaCungCap ncc = jdbcTemplate.queryForObject(sql, nccRowMapper, id);
            return Optional.ofNullable(ncc);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<NhaCungCap> findAll() {
        String sql = "SELECT * FROM nhacungcap";
        return jdbcTemplate.query(sql, nccRowMapper);
    }
}