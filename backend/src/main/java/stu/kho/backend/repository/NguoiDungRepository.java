package stu.kho.backend.repository;

import stu.kho.backend.entity.NguoiDung;
import java.util.List; // <-- Thêm import này
import java.util.Optional;

public interface NguoiDungRepository {

    // Phương thức cũ (dùng cho Đăng nhập)
    Optional<NguoiDung> findByTenDangNhap(String tenDangNhap);

    // Phương thức cũ (dùng cho Đăng ký)
    int save(NguoiDung nguoiDung);

    // Phương thức cũ (dùng cho Đăng ký)
    boolean existsByTenDangNhap(String tenDangNhap);

    // --- PHƯƠNG THỨC MỚI (BẮT BUỘC) ---
    // Phương thức này sẽ được RowMapper sử dụng để lấy quyền
    List<String> getAuthoritiesByRoleId(Integer maVaiTro);

    // --- PHƯƠNG THỨC MỚI (BẮT BUỘC CHO TỐI ƯU) ---
    // Phương thức này sẽ được JwtTokenProvider gọi khi tạo token
    List<String> getUserRolesByUsername(String tenDangNhap);

    // --- PHƯƠNG THỨC MỚI ---
    List<NguoiDung> findAll(); // Lấy tất cả user
    Optional<NguoiDung> findById(Integer id); // Tìm theo ID
    int update(NguoiDung nguoiDung); // Cập nhật user
    int deleteById(Integer id);
    // Lấy quyền (chức năng) được gán trực tiếp cho user
    List<String> getDirectAuthoritiesByUserId(Integer maNguoiDung);
}