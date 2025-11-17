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

    // Khai báo RowMapper là final, nhưng KHÔNG khởi tạo nó ở đây
    private final RowMapper<NguoiDung> nguoiDungRowMapper;

    // Constructor: Nơi khởi tạo tất cả các trường final
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
            int maVaiTro = rs.getInt("MaVaiTro");
            VaiTro vaiTro = this.vaiTroRepository.findById(maVaiTro).orElse(null);
            user.setVaiTro(vaiTro);

            // --- CẬP NHẬT LOGIC LẤY QUYỀN (AUTHORITIES) ---

            // 1. Lấy quyền theo Vai Trò (từ bảng PhanQuyen)
            List<String> roleAuthorities = List.of(); // Danh sách rỗng mặc định
            if (vaiTro != null) {
                roleAuthorities = getAuthoritiesByRoleId(vaiTro.getMaVaiTro());
            }

            // 2. Lấy quyền gán trực tiếp (từ bảng NguoiDung_ChucNang)
            List<String> directAuthorities = getDirectAuthoritiesByUserId(user.getMaNguoiDung());

            // 3. Gộp hai danh sách quyền và loại bỏ trùng lặp
            List<String> allAuthorities = Stream.concat(
                            roleAuthorities.stream(),
                            directAuthorities.stream()
                    )
                    .distinct() // Loại bỏ quyền trùng lặp
                    .collect(Collectors.toList());

            user.setAuthorities(allAuthorities); // Gán danh sách quyền đã gộp

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
    @Override
    public List<String> getDirectAuthoritiesByUserId(Integer maNguoiDung) {
        String sql = "SELECT cn.TenChucNang " +
                "FROM NguoiDung_ChucNang ndcn " +
                "JOIN chucnang cn ON ndcn.MaChucNang = cn.MaChucNang " +
                "WHERE ndcn.MaNguoiDung = ?";

        return jdbcTemplate.queryForList(sql, String.class, maNguoiDung);
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
    @Override
    public List<NguoiDung> findAll() {
        String sql = "SELECT * FROM nguoidung";
        // Dùng RowMapper đã định nghĩa trong constructor
        return jdbcTemplate.query(sql, this.nguoiDungRowMapper);
    }

    @Override
    public Optional<NguoiDung> findById(Integer id) {
        String sql = "SELECT * FROM nguoidung WHERE MaNguoiDung = ?";
        try {
            NguoiDung user = jdbcTemplate.queryForObject(sql, this.nguoiDungRowMapper, id);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public int update(NguoiDung nguoiDung) {
        // Chỉ cập nhật thông tin, không cập nhật mật khẩu
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
    public int deleteById(Integer id) {
        // Cần xóa các tham chiếu khóa ngoại trước (nếu có) hoặc set ON DELETE CASCADE
        String sql = "DELETE FROM nguoidung WHERE MaNguoiDung = ?";
        return jdbcTemplate.update(sql, id);
    }
}