package stu.kho.backend.repository;

import stu.kho.backend.entity.KhachHang;
import java.util.List;
import java.util.Optional;

public interface KhachHangRepository {
    Optional<KhachHang> findById(Integer id);
    List<KhachHang> findAll();

    // Các phương thức CRUD
    int save(KhachHang kh);
    int update(KhachHang kh);
    int deleteById(Integer id);
}