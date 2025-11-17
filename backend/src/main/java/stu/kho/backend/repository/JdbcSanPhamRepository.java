package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.LoaiHang;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.entity.SanPham;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcSanPhamRepository implements SanPhamRepository {

    private final JdbcTemplate jdbcTemplate;
    private final LoaiHangRepository loaiHangRepository;
    // XÓA: private final NhaCungCapRepository nhaCungCapRepository;

    private final RowMapper<SanPham> sanPhamRowMapper;

    // --- SỬA CONSTRUCTOR ---
    public JdbcSanPhamRepository(JdbcTemplate jdbcTemplate,
                                 LoaiHangRepository loaiHangRepository) { // Xóa NhaCungCapRepository
        this.jdbcTemplate = jdbcTemplate;
        this.loaiHangRepository = loaiHangRepository;

        // --- SỬA ROWMAPPER ---
        this.sanPhamRowMapper = (rs, rowNum) -> {
            SanPham sp = new SanPham();
            sp.setMaSP(rs.getInt("MaSP"));
            sp.setTenSP(rs.getString("TenSP"));
            sp.setMaLoai(rs.getInt("MaLoai"));

            if (sp.getMaLoai() != null) {
                LoaiHang lh = loaiHangRepository.findById(sp.getMaLoai()).orElse(null);
                sp.setLoaiHang(lh);
            }

            return sp;
        };
    }

    @Override
    public Optional<SanPham> findById(Integer id) {
        String sql = "SELECT * FROM sanpham WHERE MaSP = ?";
        try {
            SanPham sp = jdbcTemplate.queryForObject(sql, sanPhamRowMapper, id);
            return Optional.ofNullable(sp);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<SanPham> findAll() {
        String sql = "SELECT * FROM sanpham";
        return jdbcTemplate.query(sql, sanPhamRowMapper);
    }
    @Override
    public int save(SanPham sanPham) {
        String sql = "INSERT INTO sanpham (TenSP, DonViTinh, GiaNhap, SoLuongTon, MucTonToiThieu, MucTonToiDa, MaLoai) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, sanPham.getTenSP());
            ps.setString(2, sanPham.getDonViTinh());
            ps.setBigDecimal(3, sanPham.getGiaNhap());
            ps.setInt(4, sanPham.getSoLuongTon() != null ? sanPham.getSoLuongTon() : 0);
            ps.setObject(5, sanPham.getMucTonToiThieu()); // Dùng setObject cho trường có thể NULL
            ps.setObject(6, sanPham.getMucTonToiDa());
            ps.setObject(7, sanPham.getMaLoai());
            return ps;
        }, keyHolder);

        // Trả về MaSP vừa được tạo
        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            return -1; // Hoặc ném lỗi
        }
    }

    @Override
    public int update(SanPham sanPham) {
        String sql = "UPDATE sanpham SET TenSP = ?, DonViTinh = ?, GiaNhap = ?, SoLuongTon = ?, " +
                "MucTonToiThieu = ?, MucTonToiDa = ?, MaLoai = ? WHERE MaSP = ?";
        return jdbcTemplate.update(sql,
                sanPham.getTenSP(),
                sanPham.getDonViTinh(),
                sanPham.getGiaNhap(),
                sanPham.getSoLuongTon(),
                sanPham.getMucTonToiThieu(),
                sanPham.getMucTonToiDa(),
                sanPham.getMaLoai(),
                sanPham.getMaSP()
        );
    }

    @Override
    public int deleteById(Integer id) {
        // Cảnh báo: Cần đảm bảo các bảng chi tiết (chitietphieunhap,...) đã được xóa
        String sql = "DELETE FROM sanpham WHERE MaSP = ?";
        return jdbcTemplate.update(sql, id);
    }
}