package stu.kho.backend.repository;

import stu.kho.backend.entity.LoaiHang;
import java.util.List;
import java.util.Optional;

public interface LoaiHangRepository {
    Optional<LoaiHang> findById(Integer id);
    List<LoaiHang> findAll();
    int save(LoaiHang loaiHang);
    int update(LoaiHang loaiHang);
    int deleteById(Integer id);}