package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j; // 1. Import Lombok
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.KhoHangRequest;
import stu.kho.backend.dto.SanPhamTrongKhoResponse;
import stu.kho.backend.entity.KhoHang;
import stu.kho.backend.service.KhoHangService;

import java.util.List;

@RestController
@RequestMapping("/api/kho")
@CrossOrigin(origins = "*")
@Slf4j // 2. Kích hoạt Log
public class KhoHangController {

    private final KhoHangService khoHangService;

    public KhoHangController(KhoHangService khoHangService) {
        this.khoHangService = khoHangService;
    }

    // 1. LẤY DANH SÁCH KHO
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<List<KhoHang>> getAll() {
        log.info("REST request to get all KhoHang");
        return ResponseEntity.ok(khoHangService.getAllKhoHang());
    }

    // 2. LẤY CHI TIẾT KHO
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<KhoHang> getById(@PathVariable Integer id) {
        log.info("REST request to get KhoHang details, ID: {}", id);
        return ResponseEntity.ok(khoHangService.getKhoHangById(id));
    }

    // 3. THÊM KHO MỚI
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_KHO_CREATE')")
    public ResponseEntity<?> create(@RequestBody KhoHangRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to CREATE KhoHang: {}, by User: {}", request.getTenKho(), username);

        // Bỏ try-catch
        return ResponseEntity.ok(khoHangService.createKhoHang(request, username));
    }

    // 4. CẬP NHẬT KHO
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody KhoHangRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to UPDATE KhoHang ID: {}, by User: {}", id, username);

        return ResponseEntity.ok(khoHangService.updateKhoHang(id, request, username));
    }

    // 5. XÓA KHO (SOFT DELETE)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to DELETE (Soft) KhoHang ID: {}, by User: {}", id, username);

        khoHangService.deleteKhoHang(id, username);
        return ResponseEntity.ok("Đã xóa kho hàng thành công.");
    }

    // 6. XEM SẢN PHẨM TRONG KHO (Tồn kho)
    @GetMapping("/{id}/sanpham")
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<List<SanPhamTrongKhoResponse>> getSanPhamByKho(@PathVariable Integer id) {
        log.info("REST request to get SanPham inventory in Kho ID: {}", id);
        return ResponseEntity.ok(khoHangService.getSanPhamByKho(id));
    }

    // 7. TÌM KIẾM
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<List<KhoHang>> search(@RequestParam String query) {
        log.info("REST request to SEARCH KhoHang with keyword: {}", query);
        return ResponseEntity.ok(khoHangService.search(query));
    }

    // 8. XEM THÙNG RÁC (Bổ sung mới)
    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('PERM_KHO_DELETE')")
    public ResponseEntity<List<KhoHang>> getTrash() {
        log.info("REST request to get TRASH KhoHang list");
        return ResponseEntity.ok(khoHangService.getTrash());
    }

    // 9. KHÔI PHỤC (Bổ sung mới)
    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('PERM_KHO_DELETE')")
    public ResponseEntity<String> restore(@PathVariable int id) {
        log.info("REST request to RESTORE KhoHang ID: {}", id);
        khoHangService.restoreKhoHang(id);
        return ResponseEntity.ok("Khôi phục kho hàng thành công!");
    }
}