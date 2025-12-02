package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.SanPhamFilterRequest;
import stu.kho.backend.entity.LoaiHang;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.entity.SanPham;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcSanPhamRepository implements SanPhamRepository {

    private final JdbcTemplate jdbcTemplate;
    private final LoaiHangRepository loaiHangRepository;
    private final NccSanPhamRepository nccSanPhamRepository;
    private final NhaCungCapRepository nhaCungCapRepository;

    private final RowMapper<SanPham> sanPhamRowMapper;

    public JdbcSanPhamRepository(JdbcTemplate jdbcTemplate,
                                 LoaiHangRepository loaiHangRepository,
                                 NccSanPhamRepository nccSanPhamRepository,
                                 NhaCungCapRepository nhaCungCapRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.loaiHangRepository = loaiHangRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.nhaCungCapRepository = nhaCungCapRepository;

        this.sanPhamRowMapper = (rs, rowNum) -> {
            SanPham sp = new SanPham();
            sp.setMaSP(rs.getInt("MaSP"));
            sp.setTenSP(rs.getString("TenSP"));
            // --- LẤY ẢNH TỪ DB ---
            sp.setHinhAnh(rs.getString("HinhAnh"));
            // ---------------------
            sp.setDonViTinh(rs.getString("DonViTinh"));
            sp.setGiaNhap(rs.getBigDecimal("GiaNhap"));
            sp.setSoLuongTon(rs.getInt("SoLuongTon"));
            sp.setMucTonToiThieu(rs.getInt("MucTonToiThieu"));
            sp.setMucTonToiDa(rs.getInt("MucTonToiDa"));
            sp.setMaLoai(rs.getInt("MaLoai"));

            // Map Loại Hàng
            if (sp.getMaLoai() != null) {
                loaiHangRepository.findById(sp.getMaLoai()).ifPresent(sp::setLoaiHang);
            }

            // Map Danh Sách Nhà Cung Cấp
            List<Integer> nccIds = nccSanPhamRepository.findNccIdsByMaSP(sp.getMaSP());
            List<NhaCungCap> listNCC = new ArrayList<>();
            for (Integer nccId : nccIds) {
                nhaCungCapRepository.findById(nccId).ifPresent(listNCC::add);
            }
            sp.setDanhSachNCC(listNCC);

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
        // --- SỬA LỖI: THÊM CỘT HinhAnh VÀO INSERT ---
        String sql = "INSERT INTO sanpham (TenSP, HinhAnh, DonViTinh, GiaNhap, SoLuongTon, MucTonToiThieu, MucTonToiDa, MaLoai) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, sanPham.getTenSP());
            ps.setString(2, sanPham.getHinhAnh()); // <-- THÊM DÒNG NÀY
            ps.setString(3, sanPham.getDonViTinh());
            ps.setBigDecimal(4, sanPham.getGiaNhap());
            ps.setInt(5, sanPham.getSoLuongTon() != null ? sanPham.getSoLuongTon() : 0);
            ps.setObject(6, sanPham.getMucTonToiThieu());
            ps.setObject(7, sanPham.getMucTonToiDa());
            ps.setObject(8, sanPham.getMaLoai());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            return -1;
        }
    }

    @Override
    public int update(SanPham sanPham) {
        // --- SỬA LỖI: THÊM CỘT HinhAnh VÀO UPDATE ---
        String sql = "UPDATE sanpham SET TenSP = ?, HinhAnh = ?, DonViTinh = ?, GiaNhap = ?, SoLuongTon = ?, " +
                "MucTonToiThieu = ?, MucTonToiDa = ?, MaLoai = ? WHERE MaSP = ?";
        return jdbcTemplate.update(sql,
                sanPham.getTenSP(),
                sanPham.getHinhAnh(), // <-- THÊM DÒNG NÀY
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
        String sql = "DELETE FROM sanpham WHERE MaSP = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public List<SanPham> filter(SanPhamFilterRequest criteria) {
        // 1. Khởi tạo câu SQL cơ bản (luôn đúng với 1=1)
        StringBuilder sql = new StringBuilder("SELECT * FROM sanpham WHERE 1=1");
        List<Object> params = new ArrayList<>();

        // 2. Cộng chuỗi SQL động dựa trên tiêu chí

        // Tìm theo Tên (LIKE)
        if (criteria.getKeyword() != null && !criteria.getKeyword().isEmpty()) {
            sql.append(" AND TenSP LIKE ?");
            params.add("%" + criteria.getKeyword() + "%");
        }

        // Tìm theo Loại (Equal)
        if (criteria.getMaLoai() != null) {
            sql.append(" AND MaLoai = ?");
            params.add(criteria.getMaLoai());
        }

        // Tìm theo Giá (Range)
        if (criteria.getMinGia() != null) {
            sql.append(" AND GiaNhap >= ?");
            params.add(criteria.getMinGia());
        }
        if (criteria.getMaxGia() != null) {
            sql.append(" AND GiaNhap <= ?");
            params.add(criteria.getMaxGia());
        }

        // 3. Thực thi
        return jdbcTemplate.query(sql.toString(), sanPhamRowMapper, params.toArray());
    }
}