package stu.kho.backend.repository;

import stu.kho.backend.dto.PhieuDieuChuyenFilterRequest;
import stu.kho.backend.entity.PhieuDieuChuyen;

import java.util.List;
import java.util.Optional;

public interface PhieuDieuChuyenRepository {
    Integer save(PhieuDieuChuyen phieu);

    void update(PhieuDieuChuyen phieu);

    void deleteById(Integer id);

    Optional<PhieuDieuChuyen> findById(Integer id);

    List<PhieuDieuChuyen> findAll();

    List<PhieuDieuChuyen> filter(PhieuDieuChuyenFilterRequest req);
}
