package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.PhieuNhapRequest;
import stu.kho.backend.entity.PhieuNhapHang;
import stu.kho.backend.service.PhieuNhapService;

import java.util.List;

@RestController
@RequestMapping("/api/phieunhap")
@CrossOrigin(origins = "*")
public class PhieuNhapController {

    private final PhieuNhapService phieuNhapService;

    public PhieuNhapController(PhieuNhapService phieuNhapService) {
        this.phieuNhapService = phieuNhapService;
    }

    // =================================================================
    // 1. CREATE (Đã có)
    // =================================================================
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PHIEUNHAP_CREATE')")
    public ResponseEntity<?> createPhieuNhap(@RequestBody PhieuNhapRequest request,
                                             Authentication authentication) {
        try {
            String tenNguoiLap = authentication.getName();
            PhieuNhapHang phieuNhapMoi = phieuNhapService.createPhieuNhap(request, tenNguoiLap);
            return ResponseEntity.ok(phieuNhapMoi);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =================================================================
    // 2. READ (Lấy danh sách)
    // =================================================================
    @GetMapping
    @PreAuthorize("isAuthenticated()") // Ai cũng có thể xem danh sách (nếu đã đăng nhập)
    public ResponseEntity<List<PhieuNhapHang>> getAllPhieuNhap() {
        return ResponseEntity.ok(phieuNhapService.getAllPhieuNhap());
    }

    // =================================================================
    // 3. READ (Lấy chi tiết 1 phiếu)
    // =================================================================
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PhieuNhapHang> getPhieuNhapById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(phieuNhapService.getPhieuNhapById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // =================================================================
    // 4. UPDATE (Sửa phiếu)
    // =================================================================
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PHIEUNHAP_EDIT')")
    public ResponseEntity<?> updatePhieuNhap(@PathVariable Integer id,
                                             @RequestBody PhieuNhapRequest request,
                                             Authentication authentication) {
        try {
            String tenNguoiSua = authentication.getName();
            PhieuNhapHang phieuNhapUpdated = phieuNhapService.updatePhieuNhap(id, request, tenNguoiSua);
            return ResponseEntity.ok(phieuNhapUpdated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =================================================================
    // 5. DELETE (Xóa phiếu)
    // =================================================================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PHIEUNHAP_DELETE')")
    public ResponseEntity<?> deletePhieuNhap(@PathVariable Integer id,
                                             Authentication authentication) {
        try {
            String tenNguoiXoa = authentication.getName();
            phieuNhapService.deletePhieuNhap(id, tenNguoiXoa);
            return ResponseEntity.ok("Đã xóa thành công Phiếu Nhập #" + id);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}