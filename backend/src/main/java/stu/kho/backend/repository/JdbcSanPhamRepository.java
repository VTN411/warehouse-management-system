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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcSanPhamRepository implements SanPhamRepository {

    private final JdbcTemplate jdbcTemplate;
    private final LoaiHangRepository loaiHangRepository;
    // BỔ SUNG: Cần 2 repo này để lấy thông tin Nhà Cung Cấp (N:M)
    private final NccSanPhamRepository nccSanPhamRepository;
    private final NhaCungCapRepository nhaCungCapRepository;

    private final RowMapper<SanPham> sanPhamRowMapper;

    // --- CONSTRUCTOR ĐẦY ĐỦ ---
    public JdbcSanPhamRepository(JdbcTemplate jdbcTemplate,
                                 LoaiHangRepository loaiHangRepository,
                                 NccSanPhamRepository nccSanPhamRepository,
                                 NhaCungCapRepository nhaCungCapRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.loaiHangRepository = loaiHangRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.nhaCungCapRepository = nhaCungCapRepository;

        // --- ROWMAPPER ĐẦY ĐỦ ---
        this.sanPhamRowMapper = (rs, rowNum) -> {
            SanPham sp = new SanPham();
            // 1. Map các trường cơ bản (Bạn bị thiếu trong code cũ)
            sp.setMaSP(rs.getInt("MaSP"));
            sp.setTenSP(rs.getString("TenSP"));
            sp.setDonViTinh(rs.getString("DonViTinh"));
            sp.setGiaNhap(rs.getBigDecimal("GiaNhap"));
            sp.setSoLuongTon(rs.getInt("SoLuongTon"));
            sp.setMucTonToiThieu(rs.getInt("MucTonToiThieu"));
            sp.setMucTonToiDa(rs.getInt("MucTonToiDa"));
            sp.setMaLoai(rs.getInt("MaLoai"));

            // 2. Map Loại Hàng (1-N)
            if (sp.getMaLoai() != null) {
                loaiHangRepository.findById(sp.getMaLoai()).ifPresent(sp::setLoaiHang);
            }

            // 3. Map Danh Sách Nhà Cung Cấp (N-M) <-- PHẦN QUAN TRỌNG MỚI
            // B1: Tìm list ID nhà cung cấp từ bảng trung gian
            List<Integer> nccIds = nccSanPhamRepository.findNccIdsByMaSP(sp.getMaSP());

            // B2: Tìm chi tiết từng NCC và đưa vào list
            List<NhaCungCap> listNCC = new ArrayList<>();
            for (Integer nccId : nccIds) {
                nhaCungCapRepository.findById(nccId).ifPresent(listNCC::add);
            }

            // B3: Set vào đối tượng Sản phẩm
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
        String sql = "INSERT INTO sanpham (TenSP, DonViTinh, GiaNhap, SoLuongTon, MucTonToiThieu, MucTonToiDa, MaLoai) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, sanPham.getTenSP());
            ps.setString(2, sanPham.getDonViTinh());
            ps.setBigDecimal(3, sanPham.getGiaNhap());
            ps.setInt(4, sanPham.getSoLuongTon() != null ? sanPham.getSoLuongTon() : 0);
            ps.setObject(5, sanPham.getMucTonToiThieu());
            ps.setObject(6, sanPham.getMucTonToiDa());
            ps.setObject(7, sanPham.getMaLoai());
            return ps;
        }, keyHolder);

        // Trả về MaSP vừa được tạo
        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            return -1;
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
        String sql = "DELETE FROM sanpham WHERE MaSP = ?";
        return jdbcTemplate.update(sql, id);
    }
}