package stu.kho.backend.repository;

import stu.kho.backend.dto.SanPhamFilterRequest;
import stu.kho.backend.entity.SanPham;
import java.util.List;
import java.util.Optional;

public interface SanPhamRepository {
    Optional<SanPham> findById(Integer id);
    List<SanPham> findAll();
    int save(SanPham sanPham);
    int update(SanPham sanPham);
    int deleteById(Integer id);
    List<SanPham> filter(SanPhamFilterRequest criteria); // <-- THÊM MỚI
}