    package stu.kho.backend.controller;

    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize; // Đảm bảo import đúng
    import org.springframework.security.core.Authentication; // Cần thiết để lấy user hiện tại
    import org.springframework.web.bind.annotation.*;
    import stu.kho.backend.dto.HoatDongResponse;
    import stu.kho.backend.dto.UserCreateRequest;
    import stu.kho.backend.dto.UserResponse;
    import stu.kho.backend.dto.UserUpdateRequest;
    import stu.kho.backend.entity.HoatDong; // Import HoatDong Entity
    import stu.kho.backend.entity.NguoiDung; // Import NguoiDung Entity
    import stu.kho.backend.repository.HoatDongRepository; // Import HoatDong Repository
    import stu.kho.backend.repository.NccSanPhamRepository;
    import stu.kho.backend.repository.NguoiDungChucNangRepository;
    import stu.kho.backend.repository.NguoiDungRepository; // 1. Import NguoiDung Repository
    import stu.kho.backend.service.UserService;

    import java.util.List;
    // import stu.kho.backend.service.ConfigService;

    @RestController
    @RequestMapping("/api/admin")
    @CrossOrigin(origins = "*")

    public class AdminController {
        private final NguoiDungChucNangRepository nguoiDungChucNangRepository;
        private final NccSanPhamRepository nccSanPhamRepository;
        private final UserService userService;
        private final HoatDongRepository hoatDongRepository;
        private final NguoiDungRepository nguoiDungRepository; // 2. Thêm NguoiDung Repo

        // 3. Cập nhật Constructor
        public AdminController(NguoiDungChucNangRepository nguoiDungChucNangRepository, NccSanPhamRepository nccSanPhamRepository, UserService userService,
                               HoatDongRepository hoatDongRepository,
                               NguoiDungRepository nguoiDungRepository) {
            this.nguoiDungChucNangRepository = nguoiDungChucNangRepository;
            this.nccSanPhamRepository = nccSanPhamRepository;
            this.userService = userService;
            this.hoatDongRepository = hoatDongRepository;
            this.nguoiDungRepository = nguoiDungRepository;
        }

        // 1. Tạo User mới (Đã sửa phân quyền)
        @PostMapping("/users")
        @PreAuthorize("hasAuthority('PERM_ADMIN_CREATE_USER')")
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
                hoatDongRepository.save(log);
            }
        }
        @GetMapping("/users")
        @PreAuthorize("hasAuthority('PERM_ADMIN_VIEW_USERS')")
        public ResponseEntity<List<UserResponse>> getAllUsers() {
            return ResponseEntity.ok(userService.getAllUsers());
        }

        // 3. SỬA (UPDATE)
        @PutMapping("/users/{id}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')")
        public ResponseEntity<String> updateUser(@PathVariable Integer id, @RequestBody UserUpdateRequest request, Authentication authentication) {
            try {
                userService.updateUser(id, request);
                logActivity(authentication.getName(), "Cập nhật người dùng ID: " + id);
                return ResponseEntity.ok("Cập nhật người dùng thành công.");
            } catch (RuntimeException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }

        // 4. XÓA (DELETE)
        @DeleteMapping("/users/{id}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')")
        public ResponseEntity<String> deleteUser(@PathVariable Integer id, Authentication authentication) {
            try {
                userService.deleteUser(id);
                logActivity(authentication.getName(), "Xóa người dùng ID: " + id);
                return ResponseEntity.ok("Xóa người dùng thành công.");
            } catch (RuntimeException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        @PostMapping("/users/{maND}/permissions/{maCN}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')") // Hoặc quyền 'PERM_EDIT_PERMISSIONS'
        public ResponseEntity<String> assignPermissionToUser(@PathVariable Integer maND, @PathVariable Integer maCN, Authentication authentication) {
            try {
                nguoiDungChucNangRepository.linkUserToChucNang(maND, maCN);
                logActivity(authentication.getName(), "Gán quyền (MaChucNang: " + maCN + ") cho user (MaNguoiDung: " + maND + ")");
                return ResponseEntity.ok("Đã gán quyền thành công.");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Gán quyền thất bại: " + e.getMessage());
            }
        }

        @DeleteMapping("/users/{maND}/permissions/{maCN}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_DELETE_USER')") // Hoặc quyền 'PERM_EDIT_PERMISSIONS'
        public ResponseEntity<String> revokePermissionFromUser(@PathVariable Integer maND, @PathVariable Integer maCN, Authentication authentication) {
            try {
                nguoiDungChucNangRepository.unlinkUserFromChucNang(maND, maCN);
                logActivity(authentication.getName(), "Thu hồi quyền (MaChucNang: " + maCN + ") từ user (MaNguoiDung: " + maND + ")");
                return ResponseEntity.ok("Đã thu hồi quyền thành công.");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Thu hồi quyền thất bại: " + e.getMessage());
            }
        }

        // =========================================================================
        // API GÁN SẢN PHẨM - NHÀ CUNG CẤP (NCC_SanPham)
        // =========================================================================

        @PostMapping("/products/{maSP}/suppliers/{maNCC}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')") // Hoặc quyền 'PERM_EDIT_PRODUCT_LINKS'
        public ResponseEntity<String> linkSupplierToProduct(@PathVariable Integer maSP, @PathVariable Integer maNCC, Authentication authentication) {
            try {
                nccSanPhamRepository.linkNccToSanPham(maNCC, maSP);
                logActivity(authentication.getName(), "Gán NCC (MaNCC: " + maNCC + ") cho Sản phẩm (MaSP: " + maSP + ")");
                return ResponseEntity.ok("Đã gán NCC cho sản phẩm thành công.");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Gán NCC thất bại: " + e.getMessage());
            }
        }

        @DeleteMapping("/products/{maSP}/suppliers/{maNCC}")
        @PreAuthorize("hasAuthority('PERM_ADMIN_EDIT_USER')") // Hoặc quyền 'PERM_EDIT_PRODUCT_LINKS'
        public ResponseEntity<String> unlinkSupplierFromProduct(@PathVariable Integer maSP, @PathVariable Integer maNCC, Authentication authentication) {
            try {
                nccSanPhamRepository.unlinkNccFromSanPham(maNCC, maSP);
                logActivity(authentication.getName(), "Xóa NCC (MaNCC: " + maNCC + ") khỏi Sản phẩm (MaSP: " + maSP + ")");
                return ResponseEntity.ok("Đã xóa liên kết NCC khỏi sản phẩm thành công.");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Xóa liên kết NCC thất bại: " + e.getMessage());
            }
        }
        @GetMapping("/logs")
        @PreAuthorize("hasAuthority('PERM_SYSTEM_LOG')") // Bảo vệ bằng quyền mới
        public ResponseEntity<List<HoatDongResponse>> getSystemLogs() {
            List<HoatDongResponse> logs = hoatDongRepository.findAllLogs();
            return ResponseEntity.ok(logs);
        }
    }
