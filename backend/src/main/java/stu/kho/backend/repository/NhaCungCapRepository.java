package stu.kho.backend.repository;

import stu.kho.backend.entity.NhaCungCap;
import java.util.List;
import java.util.Optional;

public interface NhaCungCapRepository {
    Optional<NhaCungCap> findById(Integer id);
    List<NhaCungCap> findAll();
    // (Thêm save, update, delete nếu cần)
}