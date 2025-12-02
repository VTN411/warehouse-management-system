package stu.kho.backend.repository;

import stu.kho.backend.dto.PhieuXuatFilterRequest;
import stu.kho.backend.entity.PhieuXuatHang;

import java.util.List;
import java.util.Optional;

public interface PhieuXuatRepository {
    Integer save(PhieuXuatHang phieuXuat);

    Optional<PhieuXuatHang> findById(Integer id);

    List<PhieuXuatHang> findAll();

    int update(PhieuXuatHang px);

    int deleteById(Integer id);

    List<PhieuXuatHang> filter(PhieuXuatFilterRequest req);
}
