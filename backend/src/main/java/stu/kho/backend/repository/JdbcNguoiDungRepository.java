package stu.kho.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.VaiTro;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Repository
public class JdbcNguoiDungRepository implements NguoiDungRepository {

    private final JdbcTemplate jdbcTemplate;
    private final VaiTroRepository vaiTroRepository;
    private final RowMapper<NguoiDung> nguoiDungRowMapper;

    public JdbcNguoiDungRepository(JdbcTemplate jdbcTemplate, VaiTroRepository vaiTroRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.vaiTroRepository = vaiTroRepository;

        this.nguoiDungRowMapper = (rs, rowNum) -> {
            NguoiDung user = new NguoiDung();
            user.setMaNguoiDung(rs.getInt("MaNguoiDung"));
            user.setTenDangNhap(rs.getString("TenDangNhap"));
            user.setMatKhau(rs.getString("MatKhau"));
            user.setHoTen(rs.getString("HoTen"));
            user.setEmail(rs.getString("Email"));
            user.setSdt(rs.getString("SDT"));

            // --- THÊM: Map cột TrangThai ---
            // Giả sử trong Entity NguoiDung bạn đã thêm field 'Boolean trangThai'
            user.setTrangThai(rs.getBoolean("TrangThai"));

            int maVaiTro = rs.getInt("MaVaiTro");
            VaiTro vaiTro = this.vaiTroRepository.findById(maVaiTro).orElse(null);
            user.setVaiTro(vaiTro);

            // ... (Logic lấy quyền giữ nguyên)
            List<String> roleAuthorities = List.of();
            if (vaiTro != null) {
                roleAuthorities = getAuthoritiesByRoleId(vaiTro.getMaVaiTro());
            }
            List<String> directAuthorities = getDirectAuthoritiesByUserId(user.getMaNguoiDung());
            List<String> allAuthorities = Stream.concat(roleAuthorities.stream(), directAuthorities.stream())
                    .distinct()
                    .collect(Collectors.toList());
            user.setAuthorities(allAuthorities);

            return user;
        };
    }

    // --- CÁC PHƯƠNG THỨC SELECT (READ) ---

    @Override
    public List<NguoiDung> findAll() {
        // CHỈ LẤY NGƯỜI DÙNG ĐANG HOẠT ĐỘNG
        String sql = "SELECT * FROM nguoidung WHERE TrangThai = 1";
        return jdbcTemplate.query(sql, this.nguoiDungRowMapper);
    }

    @Override
    public Optional<NguoiDung> findById(Integer id) {
        // CHỈ TÌM THẤY NẾU CHƯA BỊ KHÓA
        String sql = "SELECT * FROM nguoidung WHERE MaNguoiDung = ? AND TrangThai = 1";
        try {
            NguoiDung user = jdbcTemplate.queryForObject(sql, this.nguoiDungRowMapper, id);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<NguoiDung> findByTenDangNhap(String tenDangNhap) {
        // ĐĂNG NHẬP: CHỈ CHO PHÉP NẾU TÀI KHOẢN ACTIVE
        String sql = "SELECT * FROM nguoidung WHERE TenDangNhap = ? AND TrangThai = 1";
        try {
            NguoiDung user = jdbcTemplate.queryForObject(sql, this.nguoiDungRowMapper, tenDangNhap);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    // --- PHƯƠNG THỨC DELETE (XÓA MỀM) ---

    @Override
    public int deleteById(Integer id) {
        // THAY VÌ XÓA, TA CẬP NHẬT TRANG THÁI = 0 (INACTIVE)
        String sql = "UPDATE nguoidung SET TrangThai = 0 WHERE MaNguoiDung = ?";
        return jdbcTemplate.update(sql, id);
    }

    // --- CÁC PHƯƠNG THỨC KHÁC ---

    @Override
    public int save(NguoiDung nguoiDung) {
        // THÊM MỚI: MẶC ĐỊNH TRẠNG THÁI LÀ 1 (ACTIVE)
        String sql = "INSERT INTO nguoidung (TenDangNhap, MatKhau, HoTen, Email, SDT, MaVaiTro, TrangThai) VALUES (?, ?, ?, ?, ?, ?, 1)";
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
    public int update(NguoiDung nguoiDung) {
        // Cập nhật thông tin cơ bản (không cập nhật password và status ở đây)
        String sql = "UPDATE nguoidung SET HoTen = ?, Email = ?, SDT = ?, MaVaiTro = ? WHERE MaNguoiDung = ?";
        return jdbcTemplate.update(sql,
                nguoiDung.getHoTen(),
                nguoiDung.getEmail(),
                nguoiDung.getSdt(),
                nguoiDung.getVaiTro().getMaVaiTro(),
                nguoiDung.getMaNguoiDung()
        );
    }

    @Override
    public boolean existsByTenDangNhap(String tenDangNhap) {
        // Kiểm tra tồn tại (Kể cả đã xóa cũng tính là tồn tại để không tạo trùng tên đăng nhập)
        String sql = "SELECT COUNT(*) FROM nguoidung WHERE TenDangNhap = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tenDangNhap);
        return count != null && count > 0;
    }

    public List<String> getUserRolesByUsername(String tenDangNhap) {
        // Chỉ lấy role nếu user đang active
        String sql = "SELECT vt.TenVaiTro FROM nguoidung nd JOIN vaitro vt ON nd.MaVaiTro = vt.MaVaiTro WHERE nd.TenDangNhap = ? AND nd.TrangThai = 1";
        try {
            return jdbcTemplate.queryForList(sql, new Object[]{tenDangNhap}, String.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public List<String> getDirectAuthoritiesByUserId(Integer maNguoiDung) {
        String sql = "SELECT cn.TenChucNang FROM nguoidung_chucnang ndcn JOIN chucnang cn ON ndcn.MaChucNang = cn.MaChucNang WHERE ndcn.MaNguoiDung = ?";
        return jdbcTemplate.queryForList(sql, String.class, maNguoiDung);
    }

    public List<String> getAuthoritiesByRoleId(Integer maVaiTro) {
        String sql = "SELECT cn.TenChucNang FROM phanquyen pq JOIN chucnang cn ON pq.MaChucNang = cn.MaChucNang WHERE pq.MaVaiTro = ?";
        return jdbcTemplate.queryForList(sql, new Object[]{maVaiTro}, String.class);
    }

    @Override
    public List<Integer> findPermissionIdsByRoleId(Integer maVaiTro) {
        String sql = "SELECT MaChucNang FROM phanquyen WHERE MaVaiTro = ?";
        try {
            return jdbcTemplate.queryForList(sql, Integer.class, maVaiTro);
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public List<Integer> findDirectPermissionIdsByUserId(Integer maNguoiDung) {
        String sql = "SELECT MaChucNang FROM nguoidung_chucnang WHERE MaNguoiDung = ?";
        try {
            return jdbcTemplate.queryForList(sql, Integer.class, maNguoiDung);
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public void restoreById(Integer id) {
        // Logic ngược lại với delete: Set TrangThai = 1 (Active)
        String sql = "UPDATE nguoidung SET TrangThai = 1 WHERE MaNguoiDung = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<NguoiDung> findAllDeleted() {
        // Chỉ lấy những user có TrangThai = 0
        String sql = "SELECT * FROM nguoidung WHERE TrangThai = 0";

        // Tái sử dụng nguoiDungRowMapper bạn đã viết trong Constructor
        return jdbcTemplate.query(sql, this.nguoiDungRowMapper);
    }
}