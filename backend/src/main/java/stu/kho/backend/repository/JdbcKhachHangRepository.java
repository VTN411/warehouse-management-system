package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.KhachHang;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcKhachHangRepository implements KhachHangRepository {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<KhachHang> khachHangRowMapper;

    public JdbcKhachHangRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.khachHangRowMapper = (rs, rowNum) -> {
            KhachHang kh = new KhachHang();
            kh.setMaKH(rs.getInt("MaKH"));
            kh.setTenKH(rs.getString("TenKH"));
            kh.setSdt(rs.getString("SDT"));
            kh.setDiaChi(rs.getString("DiaChi"));
            kh.setEmail(rs.getString("Email"));
            return kh;
        };
    }

    @Override
    public Optional<KhachHang> findById(Integer id) {
        String sql = "SELECT * FROM khachhang WHERE MaKH = ?";
        try {
            KhachHang kh = jdbcTemplate.queryForObject(sql, khachHangRowMapper, id);
            return Optional.ofNullable(kh);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<KhachHang> findAll() {
        String sql = "SELECT * FROM khachhang";
        return jdbcTemplate.query(sql, khachHangRowMapper);
    }

    @Override
    public int save(KhachHang kh) {
        String sql = "INSERT INTO khachhang (TenKH, SDT, DiaChi, Email) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, kh.getTenKH());
            ps.setString(2, kh.getSdt());
            ps.setString(3, kh.getDiaChi());
            ps.setString(4, kh.getEmail());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            return -1;
        }
    }

    @Override
    public int update(KhachHang kh) {
        String sql = "UPDATE khachhang SET TenKH = ?, SDT = ?, DiaChi = ?, Email = ? WHERE MaKH = ?";
        return jdbcTemplate.update(sql,
                kh.getTenKH(),
                kh.getSdt(),
                kh.getDiaChi(),
                kh.getEmail(),
                kh.getMaKH()
        );
    }

    @Override
    public int deleteById(Integer id) {
        String sql = "DELETE FROM khachhang WHERE MaKH = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public List<KhachHang> search(String keyword) {
        String sql = "SELECT * FROM khachhang WHERE TenKH LIKE ? OR SDT LIKE ? OR Email LIKE ?";
        String searchArg = "%" + keyword + "%";
        return jdbcTemplate.query(sql, khachHangRowMapper, searchArg, searchArg, searchArg);
    }
}