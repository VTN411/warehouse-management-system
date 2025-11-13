package stu.kho.backend.repository;

import stu.kho.backend.entity.ChiTietPhieuNhap;
import java.util.List;

public interface ChiTietPhieuNhapRepository {
    // Lưu một dòng chi tiết
    int save(ChiTietPhieuNhap chiTiet);

    // Tìm tất cả các dòng chi tiết của một phiếu nhập
    List<ChiTietPhieuNhap> findByMaPhieuNhap(Integer maPhieuNhap);

    // Xóa tất cả chi tiết khi xóa phiếu chính
    int deleteByMaPhieuNhap(Integer maPhieuNhap);
}