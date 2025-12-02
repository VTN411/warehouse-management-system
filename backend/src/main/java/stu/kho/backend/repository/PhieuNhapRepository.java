package stu.kho.backend.repository;

import stu.kho.backend.dto.PhieuNhapFilterRequest;
import stu.kho.backend.dto.SanPhamFilterRequest;
import stu.kho.backend.entity.PhieuNhapHang;
import java.util.List;
import java.util.Optional;

public interface PhieuNhapRepository {
    // Lưu phiếu nhập và trả về ID tự động tăng (MaPhieuNhap)
    Integer save(PhieuNhapHang phieuNhap);

    Optional<PhieuNhapHang> findById(Integer id);

    List<PhieuNhapHang> findAll();

    int update(PhieuNhapHang phieuNhap);

    int deleteById(Integer id);

    List<PhieuNhapHang> searchByChungTu(String chungTu);

    List<PhieuNhapHang> filter(PhieuNhapFilterRequest req);
}