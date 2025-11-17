package stu.kho.backend.repository;

import java.util.List;

public interface NccSanPhamRepository {
    // Gán một SP cho một NCC
    int linkNccToSanPham(Integer maNCC, Integer maSP);

    // Xóa liên kết
    int unlinkNccFromSanPham(Integer maNCC, Integer maSP);

    // Lấy danh sách NCC theo SP
    List<Integer> findNccIdsByMaSP(Integer maSP);
}