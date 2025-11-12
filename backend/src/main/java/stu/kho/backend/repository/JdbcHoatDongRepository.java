package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.HoatDong;

import java.time.LocalDateTime;

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
}