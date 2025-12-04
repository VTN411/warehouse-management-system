package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.KhachHangRequest;
import stu.kho.backend.entity.KhachHang;
import stu.kho.backend.service.KhachHangService;

import java.util.List;

@RestController
@RequestMapping("/api/khachhang")
@CrossOrigin(origins = "*")
public class KhachHangController {

    private final KhachHangService khachHangService;

    public KhachHangController(KhachHangService khachHangService) {
        this.khachHangService = khachHangService;
    }

    // 1. LẤY DANH SÁCH
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<List<KhachHang>> getAll() {
        return ResponseEntity.ok(khachHangService.getAllKhachHang());
    }

    // 2. LẤY CHI TIẾT
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<KhachHang> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(khachHangService.getKhachHangById(id));
    }

    // 3. THÊM MỚI
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_CREATE')")
    public ResponseEntity<?> create(@RequestBody KhachHangRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(khachHangService.createKhachHang(request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. CẬP NHẬT
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody KhachHangRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(khachHangService.updateKhachHang(id, request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. XÓA
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        try {
            khachHangService.deleteKhachHang(id, authentication.getName());
            return ResponseEntity.ok("Đã xóa khách hàng thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<List<KhachHang>> search(@RequestParam String query) {
        return ResponseEntity.ok(khachHangService.search(query));
    }
}