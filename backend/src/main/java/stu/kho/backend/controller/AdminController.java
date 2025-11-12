package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Đảm bảo import đúng
import org.springframework.security.core.Authentication; // Cần thiết để lấy user hiện tại
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.UserCreateRequest;
import stu.kho.backend.entity.HoatDong; // Import HoatDong Entity
import stu.kho.backend.entity.NguoiDung; // Import NguoiDung Entity
import stu.kho.backend.repository.HoatDongRepository; // Import HoatDong Repository
import stu.kho.backend.repository.NguoiDungRepository; // 1. Import NguoiDung Repository
import stu.kho.backend.service.UserService;
// import stu.kho.backend.service.ConfigService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository; // 2. Thêm NguoiDung Repo

    // 3. Cập nhật Constructor
    public AdminController(UserService userService,
                           HoatDongRepository hoatDongRepository,
                           NguoiDungRepository nguoiDungRepository) {
        this.userService = userService;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    // 1. Tạo User mới (Đã sửa phân quyền)
    @PreAuthorize("hasAuthority('PERM_ADMIN_CREATE_USER')")
    @PostMapping("/users")
    public ResponseEntity<String> createUser(@RequestBody UserCreateRequest request, Authentication authentication) {
        try {
            userService.createNewUser(request);

            // 4. Ghi nhật ký HoatDong (Bây giờ đã hoạt động)
            logActivity(authentication.getName(), "Tạo mới người dùng: " + request.getTenDangNhap());

            return ResponseEntity.ok("Người dùng " + request.getTenDangNhap() + " đã được tạo và cấp quyền thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Chức năng Cấu hình (Đã sửa phân quyền)
    @PreAuthorize("hasAuthority('PERM_ADMIN_UPDATE_CONFIG')")
    @PutMapping("/config/{key}")
    public ResponseEntity<String> updateSystemConfig(@PathVariable String key, @RequestBody String value, Authentication authentication) {

        // 7. Logic nghiệp vụ (Chưa hoàn thành)
        // configService.updateConfig(key, value);

        // Ghi log
        logActivity(authentication.getName(), "Cập nhật cấu hình: " + key);
        return ResponseEntity.ok("Cấu hình [" + key + "] đã được cập nhật thành công.");
    }

    // 3. Chức năng Cấu hình (Đã sửa phân quyền)
    @PreAuthorize("hasAuthority('PERM_VIEW_CONFIG')")
    @GetMapping("/config/{key}")
    public ResponseEntity<String> getSystemConfig(@PathVariable String key) {

        // 8. Logic nghiệp vụ (Chưa hoàn thành)
        // String value = configService.getConfig(key);
        // return ResponseEntity.ok("Giá trị cấu hình [" + key + "]: " + value);

        return ResponseEntity.ok("Giá trị cấu hành [" + key + "]: XXXXXX");
    }

    // =========================================================================
    // 5. HÀM GHI LOG (ĐÃ HOÀN THIỆN)
    // =========================================================================
    private void logActivity(String tenDangNhap, String hanhDong) {
        // Tìm MaNguoiDung từ TenDangNhap
        // (Chúng ta dùng .get() vì user này chắc chắn tồn tại do đã qua bộ lọc JWT)
        NguoiDung user = nguoiDungRepository.findByTenDangNhap(tenDangNhap).get();

        if (user != null) {
            HoatDong log = new HoatDong();
            log.setMaNguoiDung(user.getMaNguoiDung());
            log.setHanhDong(hanhDong);
            // Phương thức save() này đến từ JdbcHoatDongRepository
            hoatDongRepository.save(log);
        }
    }
}