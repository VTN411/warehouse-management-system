package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.SanPhamRequest;
import stu.kho.backend.entity.SanPham;
import stu.kho.backend.service.SanPhamService;

import java.util.List;

@RestController
@RequestMapping("/api/sanpham")
@CrossOrigin(origins = "*")
public class SanPhamController {

    private final SanPhamService sanPhamService;

    public SanPhamController(SanPhamService sanPhamService) {
        this.sanPhamService = sanPhamService;
    }

    // 1. LẤY DANH SÁCH (Ai đăng nhập cũng xem được, hoặc gán quyền VIEW)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SanPham>> getAllSanPham() {
        return ResponseEntity.ok(sanPhamService.getAllSanPham());
    }

    // 2. LẤY CHI TIẾT
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SanPham> getSanPhamById(@PathVariable Integer id) {
        return ResponseEntity.ok(sanPhamService.getSanPhamById(id));
    }

    // 3. THÊM SẢN PHẨM (Admin hoặc người có quyền)
    // Bạn cần thêm quyền 'PERM_PRODUCT_CREATE' vào CSDL nếu chưa có
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PRODUCT_CREATE')")
    public ResponseEntity<?> createSanPham(@RequestBody SanPhamRequest request, Authentication authentication) {
        try {
            SanPham sp = sanPhamService.createSanPham(request, authentication.getName());
            return ResponseEntity.ok(sp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. SỬA SẢN PHẨM
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ResponseEntity<?> updateSanPham(@PathVariable Integer id, @RequestBody SanPhamRequest request, Authentication authentication) {
        try {
            SanPham sp = sanPhamService.updateSanPham(id, request, authentication.getName());
            return ResponseEntity.ok(sp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. XÓA SẢN PHẨM
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_DELETE')")
    public ResponseEntity<?> deleteSanPham(@PathVariable Integer id, Authentication authentication) {
        try {
            sanPhamService.deleteSanPham(id, authentication.getName());
            return ResponseEntity.ok("Đã xóa sản phẩm thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}