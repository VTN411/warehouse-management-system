package stu.kho.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import stu.kho.backend.dto.UserCreateRequest;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.VaiTro;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;

@Service
public class UserService {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(NguoiDungRepository nguoiDungRepository, VaiTroRepository vaiTroRepository, PasswordEncoder passwordEncoder) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.vaiTroRepository = vaiTroRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Logic Tạo User mới
    public void createNewUser(UserCreateRequest request) {

        if (nguoiDungRepository.existsByTenDangNhap(request.getTenDangNhap())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        // 1. Tìm Vai Trò
        VaiTro vaiTro = vaiTroRepository.findById(request.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Vai trò không hợp lệ."));

        // 2. Tạo đối tượng NguoiDung
        NguoiDung nguoiDung = new NguoiDung();
        nguoiDung.setTenDangNhap(request.getTenDangNhap());
        // Mã hóa mật khẩu
        nguoiDung.setMatKhau(passwordEncoder.encode(request.getMatKhau()));
        nguoiDung.setHoTen(request.getHoTen());
        nguoiDung.setEmail(request.getEmail());
        nguoiDung.setSdt(request.getSdt());
        nguoiDung.setVaiTro(vaiTro); // Cấp quyền

        // 3. Lưu vào CSDL
        nguoiDungRepository.save(nguoiDung);
    }
}