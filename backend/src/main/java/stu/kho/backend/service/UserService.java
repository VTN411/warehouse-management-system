package stu.kho.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import stu.kho.backend.dto.UserCreateRequest;
import stu.kho.backend.dto.UserResponse;
import stu.kho.backend.dto.UserUpdateRequest;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.VaiTro;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.VaiTroRepository;

import java.util.List;
import java.util.stream.Collectors;

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
    public List<UserResponse> getAllUsers() {
        List<NguoiDung> users = nguoiDungRepository.findAll();
        // Chuyển Entity sang DTO để trả về
        return users.stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    // 2. SỬA USER
    public void updateUser(Integer id, UserUpdateRequest request) {
        // Tìm user hiện tại
        NguoiDung existingUser = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        // Tìm vai trò mới
        VaiTro vaiTro = vaiTroRepository.findById(request.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Vai trò không hợp lệ."));

        existingUser.setHoTen(request.getHoTen());
        existingUser.setEmail(request.getEmail());
        existingUser.setSdt(request.getSdt());
        existingUser.setVaiTro(vaiTro);

        nguoiDungRepository.update(existingUser);
    }

    // 3. XÓA USER
    public void deleteUser(Integer id) {
        if (!nguoiDungRepository.findById(id).isPresent()) {
            throw new RuntimeException("Không tìm thấy người dùng với ID: " + id);
        }
        // (Cần xử lý logic ràng buộc khóa ngoại tại đây nếu có)
        nguoiDungRepository.deleteById(id);
    }
    // --- PHƯƠNG THỨC MỚI: Lấy thông tin người dùng theo Username ---
    public UserResponse getMyInfo(String tenDangNhap) {
        // 1. Tìm user trong DB
        NguoiDung user = nguoiDungRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + tenDangNhap));

        // 2. Chuyển đổi sang DTO (Loại bỏ mật khẩu)
        return convertToUserResponse(user);
    }

    // HÀM TIỆN ÍCH: Chuyển NguoiDung (Entity) sang UserResponse (DTO)
    private UserResponse convertToUserResponse(NguoiDung user) {
        UserResponse dto = new UserResponse();
        dto.setMaNguoiDung(user.getMaNguoiDung());
        dto.setTenDangNhap(user.getTenDangNhap());
        dto.setHoTen(user.getHoTen());
        dto.setEmail(user.getEmail());
        dto.setSdt(user.getSdt());
        if (user.getVaiTro() != null) {
            dto.setTenVaiTro(user.getVaiTro().getTenVaiTro());
        }
        return dto;
    }
}