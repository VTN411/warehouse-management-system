package stu.kho.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import stu.kho.backend.entity.VaiTro;

import java.util.Optional;

@Repository
public class JdbcVaiTroRepository implements VaiTroRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcVaiTroRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<VaiTro> vaiTroRowMapper = (rs, rowNum) -> {
        VaiTro vt = new VaiTro();
        vt.setMaVaiTro(rs.getInt("MaVaiTro"));
        vt.setTenVaiTro(rs.getString("TenVaiTro"));
        return vt;
    };

    @Override
    public Optional<VaiTro> findById(Integer maVaiTro) {
        String sql = "SELECT MaVaiTro, TenVaiTro FROM vaitro WHERE MaVaiTro = ?";
        try {
            // queryForObject se lay 1 ket qua, neu khong tim thay se throw Exception
            VaiTro vt = jdbcTemplate.queryForObject(sql, new Object[]{maVaiTro}, vaiTroRowMapper);
            return Optional.ofNullable(vt);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}