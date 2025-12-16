package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import stu.kho.backend.dto.SanPhamFilterRequest;
import stu.kho.backend.dto.SanPhamRequest;
import stu.kho.backend.entity.SanPham;
import stu.kho.backend.service.SanPhamService;

import java.util.List;

@RestController
@RequestMapping("/api/sanpham")
@CrossOrigin(origins = "*")
@Slf4j
public class SanPhamController {

    private final SanPhamService sanPhamService;

    public SanPhamController(SanPhamService sanPhamService) {
        this.sanPhamService = sanPhamService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SanPham>> getAllSanPham() {
        return ResponseEntity.ok(sanPhamService.getAllSanPham());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SanPham> getSanPhamById(@PathVariable Integer id) {
        return ResponseEntity.ok(sanPhamService.getSanPhamById(id));
    }

    // --- KHÔNG CÒN TRY-CATCH ---

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('PERM_PRODUCT_CREATE')")
    public ResponseEntity<SanPham> createSanPham(
            @RequestPart("data") SanPhamRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("Request create SanPham: {}, User: {}", request.getTenSP(), username);

        // Cứ gọi bình thường. Nếu lỗi, GlobalExceptionHandler sẽ bắt.
        return ResponseEntity.ok(sanPhamService.createSanPham(request, image, username));
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ResponseEntity<SanPham> updateSanPham(
            @PathVariable Integer id,
            @RequestPart("data") SanPhamRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("Request update SanPham ID: {}, User: {}", id, username);

        return ResponseEntity.ok(sanPhamService.updateSanPham(id, request, image, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_DELETE')")
    public ResponseEntity<String> deleteSanPham(@PathVariable Integer id, Authentication authentication) {
        String username = authentication.getName();
        log.info("Request delete SanPham ID: {}, User: {}", id, username);

        sanPhamService.deleteSanPham(id, username);
        return ResponseEntity.ok("Đã xóa sản phẩm thành công.");
    }

    @PostMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SanPham>> filter(@RequestBody SanPhamFilterRequest request) {
        return ResponseEntity.ok(sanPhamService.filterSanPham(request));
    }

    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_DELETE')")
    public ResponseEntity<List<SanPham>> getTrash() {
        return ResponseEntity.ok(sanPhamService.getTrash());
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_DELETE')")
    public ResponseEntity<String> restore(@PathVariable Integer id) {
        log.info("Request restore SanPham ID: {}", id);

        // Không cần try-catch nữa
        sanPhamService.restoreSanPham(id);
        return ResponseEntity.ok("Khôi phục sản phẩm thành công!");
    }
}