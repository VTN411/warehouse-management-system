package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j; // 1. Import Lombok
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.LoaiHangRequest;
import stu.kho.backend.entity.LoaiHang;
import stu.kho.backend.service.LoaiHangService;

import java.util.List;

@RestController
@RequestMapping("/api/loaihang")
@CrossOrigin(origins = "*")
@Slf4j // 2. Kích hoạt Log
public class LoaiHangController {

    private final LoaiHangService loaiHangService;

    public LoaiHangController(LoaiHangService loaiHangService) {
        this.loaiHangService = loaiHangService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<List<LoaiHang>> getAll() {
        log.info("REST request to get all LoaiHang");
        return ResponseEntity.ok(loaiHangService.getAllLoaiHang());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<LoaiHang> getById(@PathVariable Integer id) {
        log.info("REST request to get LoaiHang details, ID: {}", id);
        return ResponseEntity.ok(loaiHangService.getLoaiHangById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATEGORY_CREATE')")
    public ResponseEntity<?> create(@RequestBody LoaiHangRequest request, Authentication auth) {
        String username = auth.getName();
        log.info("REST request to CREATE LoaiHang: {}, by User: {}", request.getTenLoai(), username);

        // Không cần try-catch (GlobalExceptionHandler sẽ lo)
        return ResponseEntity.ok(loaiHangService.createLoaiHang(request, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody LoaiHangRequest request, Authentication auth) {
        String username = auth.getName();
        log.info("REST request to UPDATE LoaiHang ID: {}, by User: {}", id, username);

        return ResponseEntity.ok(loaiHangService.updateLoaiHang(id, request, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication auth) {
        String username = auth.getName();
        log.info("REST request to DELETE (Soft) LoaiHang ID: {}, by User: {}", id, username);

        loaiHangService.deleteLoaiHang(id, username);
        return ResponseEntity.ok("Đã xóa loại hàng thành công.");
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<List<LoaiHang>> search(@RequestParam String query) {
        log.info("REST request to SEARCH LoaiHang with keyword: {}", query);
        return ResponseEntity.ok(loaiHangService.search(query));
    }

    // --- BỔ SUNG BẢO MẬT CHO THÙNG RÁC ---

    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_DELETE')") // Chỉ người có quyền xóa mới xem được thùng rác
    public ResponseEntity<List<LoaiHang>> getTrash() {
        log.info("REST request to get TRASH LoaiHang list");
        return ResponseEntity.ok(loaiHangService.getTrash());
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_DELETE')") // Chỉ người có quyền xóa mới được khôi phục
    public ResponseEntity<String> restore(@PathVariable int id) {
        log.info("REST request to RESTORE LoaiHang ID: {}", id);
        loaiHangService.restoreLoaiHang(id);
        return ResponseEntity.ok("Khôi phục loại hàng thành công!");
    }
}