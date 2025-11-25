package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.dto.HoatDongResponse;
import stu.kho.backend.entity.HoatDong;

import java.time.LocalDateTime;
import java.util.List;

@Repository // <-- ĐÁNH DẤU ĐÂY LÀ MỘT BEAN
public class JdbcHoatDongRepository implements HoatDongRepository {

    private final JdbcTemplate jdbcTemplate;

    // Spring sẽ tự động inject JdbcTemplate vào đây
    public JdbcHoatDongRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Hiện thực phương thức save
    @Override
    public int save(HoatDong hoatDong) {
        String sql = "INSERT INTO HoatDong (MaNguoiDung, HanhDong, ThoiGianThucHien) VALUES (?, ?, ?)";

        // Gán thời gian hiện tại nếu nó chưa được set
        LocalDateTime thoiGian = (hoatDong.getThoiGianThucHien() != null) ? hoatDong.getThoiGianThucHien() : LocalDateTime.now();

        return jdbcTemplate.update(sql,
                hoatDong.getMaNguoiDung(),
                hoatDong.getHanhDong(),
                thoiGian
        );
    }

    @Override
    public List<HoatDongResponse> findAllLogs() {
        // JOIN bảng hoatdong với nguoidung để lấy tên
        String sql = "SELECT h.MaHD, h.HanhDong, h.ThoiGianThucHien, n.TenDangNhap, n.HoTen " +
                "FROM hoatdong h " +
                "LEFT JOIN nguoidung n ON h.MaNguoiDung = n.MaNguoiDung " +
                "ORDER BY h.ThoiGianThucHien DESC"; // Sắp xếp mới nhất lên đầu

        RowMapper<HoatDongResponse> rowMapper = (rs, rowNum) -> {
            HoatDongResponse dto = new HoatDongResponse();
            dto.setMaHD(rs.getInt("MaHD"));
            dto.setHanhDong(rs.getString("HanhDong"));

            // Chuyển đổi Timestamp sang LocalDateTime
            if (rs.getTimestamp("ThoiGianThucHien") != null) {
                dto.setThoiGianThucHien(rs.getTimestamp("ThoiGianThucHien").toLocalDateTime());
            }

            // Thông tin người dùng (có thể null nếu user đã bị xóa)
            dto.setTenDangNhap(rs.getString("TenDangNhap"));
            dto.setHoTen(rs.getString("HoTen"));
            return dto;
        };

        return jdbcTemplate.query(sql, rowMapper);
    }
}