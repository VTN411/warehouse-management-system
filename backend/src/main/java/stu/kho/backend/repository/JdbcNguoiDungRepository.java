package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.VaiTro;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcNguoiDungRepository implements NguoiDungRepository {

    private final JdbcTemplate jdbcTemplate;
    private final VaiTroRepository vaiTroRepository;

    // Khai báo RowMapper là final, nhưng KHÔNG khởi tạo nó ở đây
    private final RowMapper<NguoiDung> nguoiDungRowMapper;

    // Constructor: Nơi khởi tạo tất cả các trường final
    public JdbcNguoiDungRepository(JdbcTemplate jdbcTemplate, VaiTroRepository vaiTroRepository) {
        // 1. GÁN GIÁ TRỊ CÁC BIẾN CẦN THIẾT
        this.jdbcTemplate = jdbcTemplate;
        this.vaiTroRepository = vaiTroRepository;

        // 2. KHỞI TẠO RowMapper SAU KHI vaiTroRepository ĐÃ ĐƯỢC GÁN
        this.nguoiDungRowMapper = (rs, rowNum) -> {
            NguoiDung user = new NguoiDung();
            user.setMaNguoiDung(rs.getInt("MaNguoiDung"));
            user.setTenDangNhap(rs.getString("TenDangNhap"));
            user.setMatKhau(rs.getString("MatKhau"));
            user.setHoTen(rs.getString("HoTen"));
            user.setEmail(rs.getString("Email"));
            user.setSdt(rs.getString("SDT"));

            int maVaiTro = rs.getInt("MaVaiTro");
            VaiTro vaiTro = this.vaiTroRepository.findById(maVaiTro).orElse(null);
            user.setVaiTro(vaiTro);

            // QUAN TRỌNG: Lấy danh sách quyền (Authorities)
            if (vaiTro != null) {
                // Lấy danh sách quyền chi tiết từ bảng PhanQuyen
                List<String> authorities = getAuthoritiesByRoleId(vaiTro.getMaVaiTro());
                user.setAuthorities(authorities); // Cần thêm trường List<String> authorities trong NguoiDung.java
            }
            return user;
        };
    }
    public List<String> getUserRolesByUsername(String tenDangNhap) {
        String sql = "SELECT vt.TenVaiTro FROM nguoidung nd JOIN vaitro vt ON nd.MaVaiTro = vt.MaVaiTro WHERE nd.TenDangNhap = ?";

        // queryForList se tra ve List<String> cac TenVaiTro
        try {
            return jdbcTemplate.queryForList(sql, new Object[]{tenDangNhap}, String.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    // --- Các phương thức @Override sử dụng RowMapper ---
    public List<String> getAuthoritiesByRoleId(Integer maVaiTro) {
        String sql = "SELECT cn.TenChucNang FROM phanquyen pq " +
                "JOIN chucnang cn ON pq.MaChucNang = cn.MaChucNang " +
                "WHERE pq.MaVaiTro = ?";

        // queryForList trả về một danh sách các String (tên quyền)
        return jdbcTemplate.queryForList(sql, new Object[]{maVaiTro}, String.class);
    }
    @Override
    public Optional<NguoiDung> findByTenDangNhap(String tenDangNhap) {
        String sql = "SELECT * FROM nguoidung WHERE TenDangNhap = ?";
        try {
            // Sử dụng this.nguoiDungRowMapper đã được khởi tạo
            NguoiDung user = jdbcTemplate.queryForObject(sql, this.nguoiDungRowMapper, tenDangNhap);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public int save(NguoiDung nguoiDung) {
        // ... (Logic save không đổi)
        String sql = "INSERT INTO nguoidung (TenDangNhap, MatKhau, HoTen, Email, SDT, MaVaiTro) VALUES (?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                nguoiDung.getTenDangNhap(),
                nguoiDung.getMatKhau(),
                nguoiDung.getHoTen(),
                nguoiDung.getEmail(),
                nguoiDung.getSdt(),
                nguoiDung.getVaiTro().getMaVaiTro()
        );
    }

    @Override
    public boolean existsByTenDangNhap(String tenDangNhap) {
        String sql = "SELECT COUNT(*) FROM nguoidung WHERE TenDangNhap = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tenDangNhap);
        return count != null && count > 0;
    }

}