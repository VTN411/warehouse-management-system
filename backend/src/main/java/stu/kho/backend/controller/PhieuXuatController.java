package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.PhieuXuatFilterRequest;
import stu.kho.backend.dto.PhieuXuatRequest;
import stu.kho.backend.entity.PhieuXuatHang;
import stu.kho.backend.service.PhieuXuatService;
import java.util.List;

@RestController
@RequestMapping("/api/phieuxuat")
@CrossOrigin(origins = "*")
public class PhieuXuatController {

    private final PhieuXuatService phieuXuatService;

    public PhieuXuatController(PhieuXuatService phieuXuatService) {
        this.phieuXuatService = phieuXuatService;
    }

    // 1. CREATE
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_CREATE')")
    public ResponseEntity<?> create(@RequestBody PhieuXuatRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(phieuXuatService.createPhieuXuat(request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_EDIT')") // Quyền: Thủ kho, Admin
    public ResponseEntity<?> updatePhieuXuat(@PathVariable Integer id,
                                             @RequestBody PhieuXuatRequest request,
                                             Authentication authentication) {
        try {
            String tenNguoiSua = authentication.getName();
            PhieuXuatHang phieuUpdated = phieuXuatService.updatePhieuXuat(id, request, tenNguoiSua);
            return ResponseEntity.ok(phieuUpdated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =================================================================
    // 7. DELETE (Xóa phiếu)
    // =================================================================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_DELETE')") // Quyền: Admin (hoặc Thủ kho nếu muốn)
    public ResponseEntity<?> deletePhieuXuat(@PathVariable Integer id,
                                             Authentication authentication) {
        try {
            String tenNguoiXoa = authentication.getName();
            phieuXuatService.deletePhieuXuat(id, tenNguoiXoa);
            return ResponseEntity.ok("Đã xóa thành công Phiếu Xuất #" + id);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // 2. APPROVE
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_APPROVE')")
    public ResponseEntity<?> approve(@PathVariable Integer id, Authentication authentication) {
        try {
            return ResponseEntity.ok(phieuXuatService.approvePhieuXuat(id, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. CANCEL
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_CANCEL')")
    public ResponseEntity<?> cancel(@PathVariable Integer id, Authentication authentication) {
        try {
            return ResponseEntity.ok(phieuXuatService.cancelPhieuXuat(id, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. GET ALL
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PhieuXuatHang>> getAll() {
        return ResponseEntity.ok(phieuXuatService.getAllPhieuXuat());
    }

    // 5. GET BY ID
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PhieuXuatHang> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(phieuXuatService.getPhieuXuatById(id));
    }
    @PostMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PhieuXuatHang>> filter(@RequestBody PhieuXuatFilterRequest request) {
        return ResponseEntity.ok(phieuXuatService.filter(request));
    }
    @PostMapping("/giangvien/create")
    @PreAuthorize("hasAuthority('PERM_PHIEUXUAT_CREATE')")
    // (Lưu ý: Giảng viên cần có quyền này, như đã config ở bước trước)
    public ResponseEntity<?> createForGiangVien(@RequestBody PhieuXuatRequest request,
                                                Authentication authentication) {
        try {
            // Không cần gửi maKH trong body, backend sẽ tự xử lý
            return ResponseEntity.ok(phieuXuatService.createPhieuXuatForGiangVien(request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}