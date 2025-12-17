package stu.kho.backend.repository;

import stu.kho.backend.entity.LoaiHang;
import java.util.List;
import java.util.Optional;

public interface LoaiHangRepository {
    Optional<LoaiHang> findById(Integer id);
    List<LoaiHang> findAll();
    int save(LoaiHang loaiHang);
    int update(LoaiHang loaiHang);
    int deleteById(Integer id);

    // BỔ SUNG: Hàm tìm kiếm
    List<LoaiHang> search(String keyword);
    void restoreById(Integer id);
    List<LoaiHang> findAllDeleted();
    boolean isDeleted(Integer id);

    boolean existsByTenLoai(String tenLoai, Integer idNgoaiTru);

}