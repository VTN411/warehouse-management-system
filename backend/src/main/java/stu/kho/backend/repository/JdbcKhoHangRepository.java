package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.KhoHang;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcKhoHangRepository implements KhoHangRepository {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<KhoHang> khoHangRowMapper;

    public JdbcKhoHangRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.khoHangRowMapper = (rs, rowNum) -> {
            KhoHang kho = new KhoHang();
            kho.setMaKho(rs.getInt("MaKho"));
            kho.setTenKho(rs.getString("TenKho"));
            kho.setDiaChi(rs.getString("DiaChi"));
            kho.setGhiChu(rs.getString("GhiChu"));
            // 1. QUAN TRỌNG: Phải map thêm cột DaXoa để logic thùng rác hoạt động
            kho.setDaXoa(rs.getBoolean("DaXoa"));
            return kho;
        };
    }

    // 2. SỬA LỖI NGHIÊM TRỌNG TẠI ĐÂY
    @Override
    public Optional<KhoHang> findById(Integer id) {
        // Cũ (Sai): "SELECT * FROM khohang WHERE DaXoa = 0 ORDER BY MaKho DESC"
        // Sai vì: Đây là câu SQL lấy danh sách, không phải lấy 1 cái theo ID, và thiếu dấu ?

        // Mới (Đúng): Phải có WHERE MaKho = ?
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
        // Lấy danh sách hiển thị (Chỉ lấy cái chưa xóa)
        String sql = "SELECT * FROM khohang WHERE DaXoa = 0 ORDER BY MaKho DESC";
        return jdbcTemplate.query(sql, khoHangRowMapper);
    }

    @Override
    public int save(KhoHang kho) {
        String sql = "INSERT INTO khohang (TenKho, DiaChi, GhiChu, DaXoa) VALUES (?, ?, ?, 0)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, kho.getTenKho());
            ps.setString(2, kho.getDiaChi());
            ps.setString(3, kho.getGhiChu());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            return -1;
        }
    }

    @Override
    public int update(KhoHang kho) {
        String sql = "UPDATE khohang SET TenKho = ?, DiaChi = ?, GhiChu = ? WHERE MaKho = ?";
        return jdbcTemplate.update(sql,
                kho.getTenKho(),
                kho.getDiaChi(),
                kho.getGhiChu(),
                kho.getMaKho()
        );
    }

    @Override
    public int deleteById(Integer id) {
        // Soft Delete
        String sql = "UPDATE khohang SET DaXoa = 1 WHERE MaKho = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public List<KhoHang> search(String keyword) {
        // Tìm kiếm (chỉ trong danh sách chưa xóa)
        String sql = "SELECT * FROM khohang WHERE (TenKho LIKE ? OR DiaChi LIKE ?) AND DaXoa = 0";
        String searchArg = "%" + keyword + "%";
        return jdbcTemplate.query(sql, khoHangRowMapper, searchArg, searchArg);
    }

    // --- LOGIC MỚI ---

    @Override
    public void restoreById(Integer id) {
        String sql = "UPDATE khohang SET DaXoa = 0 WHERE MaKho = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<KhoHang> findAllDeleted() {
        String sql = "SELECT * FROM khohang WHERE DaXoa = 1";
        return jdbcTemplate.query(sql, khoHangRowMapper);
    }
}