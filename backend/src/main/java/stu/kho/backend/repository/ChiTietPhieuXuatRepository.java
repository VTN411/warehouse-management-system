package stu.kho.backend.repository;

import stu.kho.backend.entity.ChiTietPhieuXuat;

import java.util.List;

public interface ChiTietPhieuXuatRepository {
    int save(ChiTietPhieuXuat ct);

    List<ChiTietPhieuXuat> findByMaPhieuXuat(Integer maPhieuXuat);

    int deleteByMaPhieuXuat(Integer maPhieuXuat);
}
