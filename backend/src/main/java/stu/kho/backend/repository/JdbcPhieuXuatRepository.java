package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.PhieuXuatFilterRequest;
import stu.kho.backend.entity.PhieuXuatHang;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcPhieuXuatRepository implements PhieuXuatRepository {

    private final JdbcTemplate jdbcTemplate;
    // Inject các repo khác để JOIN (KhachHang, Kho, NguoiDung)
    private final KhoHangRepository khoHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final KhachHangRepository khachHangRepository;

    private final RowMapper<PhieuXuatHang> phieuXuatRowMapper;

    public JdbcPhieuXuatRepository(JdbcTemplate jdbcTemplate,
                                   KhoHangRepository khoHangRepository,
                                   NguoiDungRepository nguoiDungRepository, KhachHangRepository khachHangRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.khoHangRepository = khoHangRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.khachHangRepository = khachHangRepository;

        this.phieuXuatRowMapper = (rs, rowNum) -> {
            PhieuXuatHang pxh = new PhieuXuatHang();
            pxh.setMaPhieuXuat(rs.getInt("MaPhieuXuat"));
            pxh.setNgayLapPhieu(rs.getTimestamp("NgayLapPhieu").toLocalDateTime());
            pxh.setTrangThai(rs.getInt("TrangThai"));
            pxh.setTongTien(rs.getBigDecimal("TongTien"));
            pxh.setMaKH(rs.getObject("MaKH", Integer.class));
            pxh.setMaKho(rs.getInt("MaKho"));
            pxh.setNguoiLap(rs.getInt("NguoiLap"));
            pxh.setNguoiDuyet(rs.getObject("NguoiDuyet", Integer.class)); // Xử lý NULL
            pxh.setChungTu(rs.getString("ChungTu"));

            // JOIN dữ liệu
            if (pxh.getMaKho() != null) {
                pxh.setKhoHang(khoHangRepository.findById(pxh.getMaKho()).orElse(null));
            }
            if (pxh.getMaKH() != null) {
                pxh.setKhachHang(khachHangRepository.findById(pxh.getMaKH()).orElse(null));
            }
            return pxh;
        };
    }

    @Override
    public Integer save(PhieuXuatHang phieuXuat) {
        String sql = "INSERT INTO phieuxuathang (NgayLapPhieu, TrangThai, TongTien, MaKH, MaKho, NguoiLap, NguoiDuyet, ChungTu) " +
                "VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, phieuXuat.getTrangThai());
            ps.setBigDecimal(2, phieuXuat.getTongTien());
            ps.setObject(3, phieuXuat.getMaKH());
            ps.setInt(4, phieuXuat.getMaKho());
            ps.setInt(5, phieuXuat.getNguoiLap());
            ps.setObject(6, phieuXuat.getNguoiDuyet());
            ps.setString(7, phieuXuat.getChungTu());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        }
        return -1;
    }

    @Override
    public Optional<PhieuXuatHang> findById(Integer id) {
        String sql = "SELECT * FROM phieuxuathang WHERE MaPhieuXuat = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, phieuXuatRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<PhieuXuatHang> findAll() {
        String sql = "SELECT * FROM phieuxuathang";
        return jdbcTemplate.query(sql, phieuXuatRowMapper);
    }

    @Override
    public int update(PhieuXuatHang px) {
        String sql = "UPDATE phieuxuathang SET TrangThai=?, TongTien=?, MaKH=?, MaKho=?, NguoiDuyet=?, ChungTu=? WHERE MaPhieuXuat=?";
        return jdbcTemplate.update(sql, px.getTrangThai(), px.getTongTien(), px.getMaKH(), px.getMaKho(), px.getNguoiDuyet(), px.getChungTu(), px.getMaPhieuXuat());
    }

    @Override
    public int deleteById(Integer id) {
        String sql = "DELETE FROM phieuxuathang WHERE MaPhieuXuat = ?";
        return jdbcTemplate.update(sql, id);
    }
    @Override
    public List<PhieuXuatHang> filter(PhieuXuatFilterRequest req) {
        StringBuilder sql = new StringBuilder("SELECT * FROM phieuxuathang WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (req.getChungTu() != null && !req.getChungTu().isEmpty()) {
            sql.append(" AND ChungTu LIKE ?");
            params.add("%" + req.getChungTu() + "%");
        }
        if (req.getTrangThai() != null) {
            sql.append(" AND TrangThai = ?");
            params.add(req.getTrangThai());
        }
        if (req.getMaKho() != null) {
            sql.append(" AND MaKho = ?");
            params.add(req.getMaKho());
        }
        if (req.getMaKH() != null) {
            sql.append(" AND MaKH = ?");
            params.add(req.getMaKH());
        }
        if (req.getFromDate() != null) {
            sql.append(" AND NgayLapPhieu >= ?");
            params.add(req.getFromDate().atStartOfDay());
        }
        if (req.getToDate() != null) {
            sql.append(" AND NgayLapPhieu <= ?");
            params.add(req.getToDate().atTime(23, 59, 59));
        }

        sql.append(" ORDER BY NgayLapPhieu DESC");
        return jdbcTemplate.query(sql.toString(), phieuXuatRowMapper, params.toArray());
    }
    @Override
    public List<PhieuXuatHang> findByNguoiLap(Integer maNguoiLap) {
        String sql = "SELECT * FROM phieuxuathang WHERE NguoiLap = ? ORDER BY NgayLapPhieu DESC";
        return jdbcTemplate.query(sql, phieuXuatRowMapper, maNguoiLap);
    }
}