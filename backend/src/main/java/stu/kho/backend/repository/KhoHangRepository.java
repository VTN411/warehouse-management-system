package stu.kho.backend.repository;

import stu.kho.backend.entity.KhoHang;
import java.util.List;
import java.util.Optional;

public interface KhoHangRepository {
    Optional<KhoHang> findById(Integer id);
    List<KhoHang> findAll();
    // (Thêm save, update, delete nếu cần)
}