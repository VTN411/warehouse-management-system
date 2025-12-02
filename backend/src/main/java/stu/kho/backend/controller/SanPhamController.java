package stu.kho.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
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
    // =================================================================
    // 1. THÊM SẢN PHẨM (CÓ ẢNH) - SỬA LỖI TẠI ĐÂY
    // =================================================================
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE }) // Bắt buộc dùng multipart
    @PreAuthorize("hasAuthority('PERM_PRODUCT_CREATE')")
    public ResponseEntity<?> createSanPham(
            // Dùng @RequestPart thay vì @RequestBody
            @RequestPart("data") SanPhamRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            // Truyền đủ 3 tham số vào Service
            SanPham sp = sanPhamService.createSanPham(request, image, authentication.getName());
            return ResponseEntity.ok(sp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =================================================================
    // 2. SỬA SẢN PHẨM (CÓ ẢNH) - CŨNG CẦN SỬA TƯƠNG TỰ
    // =================================================================
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ResponseEntity<?> updateSanPham(
            @PathVariable Integer id,
            @RequestPart("data") SanPhamRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            // Truyền đủ 4 tham số vào Service
            SanPham sp = sanPhamService.updateSanPham(id, request, image, authentication.getName());
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
    // Tìm kiếm sản phẩm: GET /api/sanpham/search?query=Iphone
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SanPham>> search(@RequestParam String query) {
        return ResponseEntity.ok(sanPhamService.searchSanPham(query));
    }
}