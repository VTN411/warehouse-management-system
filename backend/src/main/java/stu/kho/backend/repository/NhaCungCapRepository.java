package stu.kho.backend.repository;

import stu.kho.backend.entity.NhaCungCap;
import java.util.List;
import java.util.Optional;

public interface NhaCungCapRepository {
    Optional<NhaCungCap> findById(Integer id);
    List<NhaCungCap> findAll();

    // Cập nhật các dòng này:
    int save(NhaCungCap ncc);     // Đổi từ void sang int (trả về ID)
    int update(NhaCungCap ncc);   // Thêm mới
    int deleteById(Integer id);   // Thêm mới
}