package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j; // 1. Import Lombok
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.HoatDongResponse;
import stu.kho.backend.dto.UserCreateRequest;
import stu.kho.backend.dto.UserResponse;
import stu.kho.backend.dto.UserUpdateRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.NccSanPhamRepository;
import stu.kho.backend.repository.NguoiDungChucNangRepository;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@Slf4j // 2. Kích hoạt Log
public class AdminController {

    private final NguoiDungChucNangRepository nguoiDungChucNangRepository;
    private final NccSanPhamRepository nccSanPhamRepository;
    private final UserService userService;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public AdminController(NguoiDungChucNangRepository nguoiDungChucNangRepository,
                           NccSanPhamRepository nccSanPhamRepository,
                           UserService userService,
                           HoatDongRepository hoatDongRepository,
                           NguoiDungRepository nguoiDungRepository) {
        this.nguoiDungChucNangRepository = nguoiDungChucNangRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.userService = userService;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    // =========================================================================
    // QUẢN LÝ USER
    // =========================================================================

    // 1. Lấy danh sách User (Active)
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('PERM_ADMIN_VIEW_USERS')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 2. Tạo User mới
    @PostMapping("/users")
    @PreAuthorize("hasAuthority('PERM_ADMIN_CREATE_USER')")
    public ResponseEntity<String> createUser(@RequestBody UserCreateRequest request, Authentication authentication) {
        userService.createNewUser(request);
        logActivity(authentication.getName(), "Tạo mới người dùng: " + request.getTenDangNhap());
        return ResponseEntity.ok("Người dùng " + request.getTenDangNhap() + " đã được tạo thành công.");
    }

    // 3. Cập nhật User
    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')")
    public ResponseEntity<String> updateUser(@PathVariable Integer id, @RequestBody UserUpdateRequest request, Authentication authentication) {
        userService.updateUser(id, request);
        logActivity(authentication.getName(), "Cập nhật người dùng ID: " + id);
        return ResponseEntity.ok("Cập nhật người dùng thành công.");
    }

    // 4. Xóa User (Soft Delete)
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id, Authentication authentication) {
        userService.deleteUser(id);
        logActivity(authentication.getName(), "Xóa (Soft) người dùng ID: " + id);
        return ResponseEntity.ok("Xóa người dùng thành công.");
    }

    // 5. Xem thùng rác User
    @GetMapping("/users/trash") // Sửa đường dẫn cho chuẩn REST
    @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')")
    public ResponseEntity<List<UserResponse>> getTrashUsers() {
        return ResponseEntity.ok(userService.getTrashUsers());
    }

    // 6. Khôi phục User
    @PutMapping("/users/{id}/restore") // Sửa đường dẫn cho chuẩn REST
    @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')")
    public ResponseEntity<String> restoreUser(@PathVariable Integer id, Authentication authentication) {
        userService.restoreUser(id);
        logActivity(authentication.getName(), "Khôi phục người dùng ID: " + id);
        return ResponseEntity.ok("Khôi phục tài khoản thành công!");
    }

    // =========================================================================
    // QUẢN LÝ QUYỀN HẠN (PHÂN QUYỀN NÂNG CAO)
    // =========================================================================

    @PostMapping("/users/{maND}/permissions/{maCN}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')")
    public ResponseEntity<String> assignPermissionToUser(@PathVariable Integer maND, @PathVariable Integer maCN, Authentication authentication) {
        nguoiDungChucNangRepository.linkUserToChucNang(maND, maCN);
        logActivity(authentication.getName(), "Gán quyền (MaChucNang: " + maCN + ") cho user ID: " + maND);
        return ResponseEntity.ok("Đã gán quyền thành công.");
    }

    @DeleteMapping("/users/{maND}/permissions/{maCN}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')")
    public ResponseEntity<String> revokePermissionFromUser(@PathVariable Integer maND, @PathVariable Integer maCN, Authentication authentication) {
        nguoiDungChucNangRepository.unlinkUserFromChucNang(maND, maCN);
        logActivity(authentication.getName(), "Thu hồi quyền (MaChucNang: " + maCN + ") từ user ID: " + maND);
        return ResponseEntity.ok("Đã thu hồi quyền thành công.");
    }

    // =========================================================================
    // LIÊN KẾT SẢN PHẨM - NHÀ CUNG CẤP
    // =========================================================================

    @PostMapping("/products/{maSP}/suppliers/{maNCC}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')")
    public ResponseEntity<String> linkSupplierToProduct(@PathVariable Integer maSP, @PathVariable Integer maNCC, Authentication authentication) {
        nccSanPhamRepository.linkNccToSanPham(maNCC, maSP);
        logActivity(authentication.getName(), "Gán NCC ID: " + maNCC + " cho SP ID: " + maSP);
        return ResponseEntity.ok("Đã gán NCC cho sản phẩm thành công.");
    }

    @DeleteMapping("/products/{maSP}/suppliers/{maNCC}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')")
    public ResponseEntity<String> unlinkSupplierFromProduct(@PathVariable Integer maSP, @PathVariable Integer maNCC, Authentication authentication) {
        nccSanPhamRepository.unlinkNccFromSanPham(maNCC, maSP);
        logActivity(authentication.getName(), "Gỡ NCC ID: " + maNCC + " khỏi SP ID: " + maSP);
        return ResponseEntity.ok("Đã xóa liên kết NCC khỏi sản phẩm thành công.");
    }

    // =========================================================================
    // HỆ THỐNG (LOG & CONFIG)
    // =========================================================================

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('PERM_SYSTEM_LOG')")
    public ResponseEntity<List<HoatDongResponse>> getSystemLogs() {
        // Đảm bảo Repo trả về đúng DTO HoatDongResponse
        return ResponseEntity.ok(hoatDongRepository.findAllLogs());
    }

    @PutMapping("/config/{key}")
    @PreAuthorize("hasAuthority('PERM_ADMIN_UPDATE_CONFIG')")
    public ResponseEntity<String> updateSystemConfig(@PathVariable String key, @RequestBody String value, Authentication authentication) {
        // configService.updateConfig(key, value);
        logActivity(authentication.getName(), "Cập nhật cấu hình: " + key);
        return ResponseEntity.ok("Cấu hình [" + key + "] đã được cập nhật thành công.");
    }

    @GetMapping("/config/{key}")
    @PreAuthorize("hasAuthority('PERM_VIEW_CONFIG')")
    public ResponseEntity<String> getSystemConfig(@PathVariable String key) {
        // String value = configService.getConfig(key);
        return ResponseEntity.ok("Giá trị cấu hình [" + key + "]: DEMO_VALUE");
    }

    // =========================================================================
    // HELPER: GHI LOG VÀO DB & CONSOLE
    // =========================================================================
    private void logActivity(String tenDangNhap, String hanhDong) {
        // 1. Ghi log ra Console để debug nhanh
        log.info("ADMIN ACTIVITY - User: {}, Action: {}", tenDangNhap, hanhDong);

        // 2. Ghi log vào Database để lưu vết
        NguoiDung user = nguoiDungRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User để ghi log: " + tenDangNhap));

        HoatDong dbLog = new HoatDong();
        dbLog.setMaNguoiDung(user.getMaNguoiDung());
        dbLog.setHanhDong(hanhDong);

        // Lưu ý: Cột ThoiGian thường được DB tự sinh (Default CURRENT_TIMESTAMP)
        // Nếu không, bạn cần set: dbLog.setThoiGian(LocalDateTime.now());

        hoatDongRepository.save(dbLog);
    }
}