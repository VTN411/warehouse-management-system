package stu.kho.backend.repository;

public interface NguoiDungChucNangRepository {
    // Gán 1 quyền (ChucNang) trực tiếp cho 1 user (NguoiDung)
    int linkUserToChucNang(Integer maNguoiDung, Integer maChucNang);

    // Xóa 1 quyền (ChucNang) khỏi 1 user (NguoiDung)
    int unlinkUserFromChucNang(Integer maNguoiDung, Integer maChucNang);
}