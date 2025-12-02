package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.KhoHang;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.entity.PhieuNhapHang;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcPhieuNhapRepository implements PhieuNhapRepository {

    private final JdbcTemplate jdbcTemplate;
    // Inject các repo khác để JOIN dữ liệu
    private final NhaCungCapRepository nhaCungCapRepository;
    private final KhoHangRepository khoHangRepository;
    private final NguoiDungRepository nguoiDungRepository;

    private final RowMapper<PhieuNhapHang> phieuNhapRowMapper;

    public JdbcPhieuNhapRepository(JdbcTemplate jdbcTemplate,
                                   NhaCungCapRepository nhaCungCapRepository,
                                   KhoHangRepository khoHangRepository,
                                   NguoiDungRepository nguoiDungRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.nhaCungCapRepository = nhaCungCapRepository;
        this.khoHangRepository = khoHangRepository;
        this.nguoiDungRepository = nguoiDungRepository;

        // Khởi tạo RowMapper
        this.phieuNhapRowMapper = (rs, rowNum) -> {
            PhieuNhapHang pnh = new PhieuNhapHang();
            pnh.setMaPhieuNhap(rs.getInt("MaPhieuNhap"));
            pnh.setNgayLapPhieu(rs.getTimestamp("NgayLapPhieu").toLocalDateTime());
            pnh.setTrangThai(rs.getInt("TrangThai"));
            pnh.setTongTien(rs.getBigDecimal("TongTien"));
            pnh.setMaNCC(rs.getInt("MaNCC"));
            pnh.setMaKho(rs.getInt("MaKho"));
            pnh.setNguoiLap(rs.getInt("NguoiLap"));

            // --- SỬA LỖI ĐỌC NULL CHO INTEGER ---
            // Sử dụng rs.getObject() để lấy NULL thay vì 0
            Integer nguoiDuyetId = rs.getObject("NguoiDuyet", Integer.class);
            pnh.setNguoiDuyet(nguoiDuyetId);
            // --- KẾT THÚC SỬA LỖI ---

            pnh.setChungTu(rs.getString("ChungTu"));

            // --- JOIN Dữ liệu (Tải đối tượng liên quan) ---
            if (pnh.getMaNCC() != null) {
                pnh.setNhaCungCap(nhaCungCapRepository.findById(pnh.getMaNCC()).orElse(null));
            }
            if (pnh.getMaKho() != null) {
                pnh.setKhoHang(khoHangRepository.findById(pnh.getMaKho()).orElse(null));
            }

            return pnh;
        };
    }

    @Override
    public Integer save(PhieuNhapHang phieuNhap) {
        String sql = "INSERT INTO phieunhaphang (NgayLapPhieu, TrangThai, TongTien, MaNCC, MaKho, NguoiLap, NguoiDuyet, ChungTu) " +
                "VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, phieuNhap.getTrangThai());
            ps.setBigDecimal(2, phieuNhap.getTongTien());
            ps.setInt(3, phieuNhap.getMaNCC());
            ps.setInt(4, phieuNhap.getMaKho());
            ps.setInt(5, phieuNhap.getNguoiLap());
            ps.setObject(6, phieuNhap.getNguoiDuyet()); // NguoiDuyet có thể là NULL
            ps.setString(7, phieuNhap.getChungTu());
            return ps;
        }, keyHolder);

        // Trả về MaPhieuNhap (ID) vừa được tạo
        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            throw new RuntimeException("Không thể lấy ID được tạo cho Phiếu Nhập Hàng.");
        }
    }

    @Override
    public List<PhieuNhapHang> findAll() {
        String sql = "SELECT * FROM phieunhaphang";
        return jdbcTemplate.query(sql, phieuNhapRowMapper);
    }

    @Override
    public Optional<PhieuNhapHang> findById(Integer id) {
        String sql = "SELECT * FROM phieunhaphang WHERE MaPhieuNhap = ?";
        try {
            PhieuNhapHang pnh = jdbcTemplate.queryForObject(sql, phieuNhapRowMapper, id);
            return Optional.ofNullable(pnh);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public int update(PhieuNhapHang phieuNhap) {
        String sql = "UPDATE phieunhaphang SET TrangThai = ?, TongTien = ?, MaNCC = ?, MaKho = ?, " +
                "NguoiLap = ?, NguoiDuyet = ?, ChungTu = ? WHERE MaPhieuNhap = ?";
        return jdbcTemplate.update(sql,
                phieuNhap.getTrangThai(),
                phieuNhap.getTongTien(),
                phieuNhap.getMaNCC(),
                phieuNhap.getMaKho(),
                phieuNhap.getNguoiLap(),
                phieuNhap.getNguoiDuyet(),
                phieuNhap.getChungTu(),
                phieuNhap.getMaPhieuNhap()
        );
    }

    @Override
    public int deleteById(Integer id) {
        // Cảnh báo: Phải xóa ChiTietPhieuNhap trước khi xóa phiếu chính.
        String sql = "DELETE FROM phieunhaphang WHERE MaPhieuNhap = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public List<PhieuNhapHang> searchByChungTu(String chungTu) {
        // Tìm chính xác hoặc tương đối theo mã chứng từ
        String sql = "SELECT * FROM phieunhaphang WHERE ChungTu LIKE ?";
        return jdbcTemplate.query(sql, phieuNhapRowMapper, "%" + chungTu + "%");
    }
}