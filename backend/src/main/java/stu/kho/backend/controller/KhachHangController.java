package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j; // 1. Import Lombok
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
@Slf4j // 2. Kích hoạt Log
public class KhachHangController {

    private final KhachHangService khachHangService;

    public KhachHangController(KhachHangService khachHangService) {
        this.khachHangService = khachHangService;
    }

    // 1. LẤY DANH SÁCH
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<List<KhachHang>> getAll() {
        log.info("REST request to get all KhachHang");
        return ResponseEntity.ok(khachHangService.getAllKhachHang());
    }

    // 2. LẤY CHI TIẾT
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<KhachHang> getById(@PathVariable Integer id) {
        log.info("REST request to get KhachHang details, ID: {}", id);
        return ResponseEntity.ok(khachHangService.getKhachHangById(id));
    }

    // 3. THÊM MỚI
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_CREATE')")
    public ResponseEntity<?> create(@RequestBody KhachHangRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to CREATE KhachHang: {}, by User: {}", request.getTenKH(), username);

        // Bỏ try-catch, GlobalExceptionHandler sẽ xử lý nếu có lỗi
        return ResponseEntity.ok(khachHangService.createKhachHang(request, username));
    }

    // 4. CẬP NHẬT
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody KhachHangRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to UPDATE KhachHang ID: {}, by User: {}", id, username);

        return ResponseEntity.ok(khachHangService.updateKhachHang(id, request, username));
    }

    // 5. XÓA (SOFT DELETE)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to DELETE (Soft) KhachHang ID: {}, by User: {}", id, username);

        khachHangService.deleteKhachHang(id, username);
        return ResponseEntity.ok("Đã xóa khách hàng thành công.");
    }

    // 6. TÌM KIẾM
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ResponseEntity<List<KhachHang>> search(@RequestParam String query) {
        log.info("REST request to SEARCH KhachHang with keyword: {}", query);
        return ResponseEntity.ok(khachHangService.search(query));
    }

    // 7. XEM THÙNG RÁC (Bổ sung mới)
    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_DELETE')") // Chỉ người có quyền xóa mới xem được rác
    public ResponseEntity<List<KhachHang>> getTrash() {
        log.info("REST request to get TRASH KhachHang list");
        return ResponseEntity.ok(khachHangService.getTrash());
    }

    // 8. KHÔI PHỤC (Bổ sung mới)
    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_DELETE')") // Quyền xóa kiêm quyền khôi phục
    public ResponseEntity<String> restore(@PathVariable int id) {
        log.info("REST request to RESTORE KhachHang ID: {}", id);
        khachHangService.restoreKhachHang(id);
        return ResponseEntity.ok("Khôi phục khách hàng thành công!");
    }
}