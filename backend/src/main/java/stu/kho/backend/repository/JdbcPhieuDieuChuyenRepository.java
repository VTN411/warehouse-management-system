package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.PhieuDieuChuyen;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcPhieuDieuChuyenRepository implements PhieuDieuChuyenRepository {

    private final JdbcTemplate jdbcTemplate;
    private final KhoHangRepository khoHangRepository;
    private final NguoiDungRepository nguoiDungRepository;

    private final RowMapper<PhieuDieuChuyen> rowMapper;

    public JdbcPhieuDieuChuyenRepository(JdbcTemplate jdbcTemplate,
                                         KhoHangRepository khoHangRepository,
                                         NguoiDungRepository nguoiDungRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.khoHangRepository = khoHangRepository;
        this.nguoiDungRepository = nguoiDungRepository;

        this.rowMapper = (rs, rowNum) -> {
            PhieuDieuChuyen pdc = new PhieuDieuChuyen();
            pdc.setMaPhieuDC(rs.getInt("MaPhieuDC"));
            pdc.setMaKhoXuat(rs.getInt("MaKhoXuat"));
            pdc.setMaKhoNhap(rs.getInt("MaKhoNhap"));
            pdc.setNgayChuyen(rs.getTimestamp("NgayChuyen").toLocalDateTime());
            pdc.setNguoiLap(rs.getInt("NguoiLap"));
            pdc.setGhiChu(rs.getString("GhiChu"));
            pdc.setChungTu(rs.getString("ChungTu"));
            pdc.setTrangThai(rs.getInt("TrangThai"));

            // Xử lý NguoiDuyet (có thể null)
            Integer nguoiDuyet = rs.getObject("NguoiDuyet", Integer.class);
            pdc.setNguoiDuyet(nguoiDuyet);

            // JOIN thông tin Kho và Người dùng
            if (pdc.getMaKhoXuat() != null)
                pdc.setKhoXuat(khoHangRepository.findById(pdc.getMaKhoXuat()).orElse(null));
            if (pdc.getMaKhoNhap() != null)
                pdc.setKhoNhap(khoHangRepository.findById(pdc.getMaKhoNhap()).orElse(null));

            // (Tùy chọn: Load thông tin người lập nếu cần)
            return pdc;
        };
    }

    @Override
    public Integer save(PhieuDieuChuyen phieu) {
        String sql = "INSERT INTO phieudieuchuyen (MaKhoXuat, MaKhoNhap, NgayChuyen, NguoiLap, GhiChu, ChungTu, TrangThai) " +
                "VALUES (?, ?, NOW(), ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, phieu.getMaKhoXuat());
            ps.setInt(2, phieu.getMaKhoNhap());
            ps.setInt(3, phieu.getNguoiLap());
            ps.setString(4, phieu.getGhiChu());
            ps.setString(5, phieu.getChungTu());
            ps.setInt(6, phieu.getTrangThai());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : -1;
    }

    @Override
    public void update(PhieuDieuChuyen phieu) {
        String sql = "UPDATE phieudieuchuyen SET TrangThai = ?, NguoiDuyet = ? WHERE MaPhieuDC = ?";
        jdbcTemplate.update(sql, phieu.getTrangThai(), phieu.getNguoiDuyet(), phieu.getMaPhieuDC());
    }

    @Override
    public Optional<PhieuDieuChuyen> findById(Integer id) {
        try {
            String sql = "SELECT * FROM phieudieuchuyen WHERE MaPhieuDC = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<PhieuDieuChuyen> findAll() {
        String sql = "SELECT * FROM phieudieuchuyen ORDER BY MaPhieuDC DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }
}