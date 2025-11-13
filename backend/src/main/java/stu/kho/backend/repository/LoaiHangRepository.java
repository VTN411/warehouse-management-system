package stu.kho.backend.repository;

import stu.kho.backend.entity.LoaiHang;
import java.util.List;
import java.util.Optional;

public interface LoaiHangRepository {
    Optional<LoaiHang> findById(Integer id);
    List<LoaiHang> findAll();
    // (Thêm save, update, delete nếu Admin có quyền quản lý danh mục này)
}