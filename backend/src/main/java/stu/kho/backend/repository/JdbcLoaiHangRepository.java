package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.LoaiHang;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcLoaiHangRepository implements LoaiHangRepository {

    private final JdbcTemplate jdbcTemplate;

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
        // SỬA LỖI: Thêm điều kiện AND DaXoa = 0
        String sql = "SELECT * FROM loaihang WHERE MaLoai = ? AND DaXoa = 0";
        try {
            LoaiHang loai = jdbcTemplate.queryForObject(sql, loaiHangRowMapper, id);
            return Optional.ofNullable(loai);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<LoaiHang> findAll() {
        String sql = "SELECT * FROM loaihang WHERE DaXoa = 0";
        return jdbcTemplate.query(sql, loaiHangRowMapper);
    }

    @Override
    public int save(LoaiHang loaiHang) {
        // Mặc định DaXoa là 0
        String sql = "INSERT INTO loaihang (TenLoai, MoTa, DaXoa) VALUES (?, ?, 0)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, loaiHang.getTenLoai());
            ps.setString(2, loaiHang.getMoTa());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : -1;
    }

    @Override
    public int update(LoaiHang loaiHang) {
        String sql = "UPDATE loaihang SET TenLoai = ?, MoTa = ? WHERE MaLoai = ?";
        return jdbcTemplate.update(sql,
                loaiHang.getTenLoai(),
                loaiHang.getMoTa(),
                loaiHang.getMaLoai()
        );
    }

    @Override
    public int deleteById(Integer id) {
        // Soft Delete: Cập nhật cờ xóa
        String sql = "UPDATE loaihang SET DaXoa = 1 WHERE MaLoai = ?";
        return jdbcTemplate.update(sql, id);
    }

    // BỔ SUNG: Hàm tìm kiếm
    @Override
    public List<LoaiHang> search(String keyword) {
        String sql = "SELECT * FROM loaihang WHERE (TenLoai LIKE ? OR MoTa LIKE ?) AND DaXoa = 0";
        String searchArg = "%" + keyword + "%";
        return jdbcTemplate.query(sql, loaiHangRowMapper, searchArg, searchArg);
    }

    @Override
    public void restoreById(Integer id) {
        String sql = "UPDATE loaihang SET DaXoa = 0 WHERE MaLoai = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<LoaiHang> findAllDeleted() {
        String sql = "SELECT * FROM loaihang WHERE DaXoa = 1";
        return jdbcTemplate.query(sql, loaiHangRowMapper);
    }

    @Override
    public boolean isDeleted(Integer id) {
        // Lấy trạng thái DaXoa của loại hàng theo ID
        String sql = "SELECT DaXoa FROM loaihang WHERE MaLoai = ?";
        try {
            // queryForObject trả về true/false (bit 1/0)
            Boolean daXoa = jdbcTemplate.queryForObject(sql, Boolean.class, id);
            return daXoa != null && daXoa; // Trả về true nếu DaXoa = 1
        } catch (EmptyResultDataAccessException e) {
            return false;
        }
    }
}