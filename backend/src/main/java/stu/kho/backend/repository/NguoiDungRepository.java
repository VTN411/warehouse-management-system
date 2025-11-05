package stu.kho.backend.repository;

import stu.kho.backend.entity.NguoiDung;
import java.util.Optional;

public interface NguoiDungRepository {
    // Tim user bang ten dang nhap (dung cho dang nhap/security)
    Optional<NguoiDung> findByTenDangNhap(String tenDangNhap);

    // Luu user moi (dang ky)
    int save(NguoiDung nguoiDung);

    // Kiem tra ten dang nhap ton tai (dung cho dang ky)
    boolean existsByTenDangNhap(String tenDangNhap);
}