package stu.kho.backend.controller;

import lombok.extern.slf4j.Slf4j; // 1. Import Lombok
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.NhaCungCapRequest;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.service.NhaCungCapService;

import java.util.List;

@RestController
@RequestMapping("/api/nhacungcap")
@CrossOrigin(origins = "*")
@Slf4j // 2. Kích hoạt Log
public class NhaCungCapController {

    private final NhaCungCapService nhaCungCapService;

    public NhaCungCapController(NhaCungCapService nhaCungCapService) {
        this.nhaCungCapService = nhaCungCapService;
    }

    // 1. LẤY DANH SÁCH
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<List<NhaCungCap>> getAll() {
        log.info("REST request to get all NhaCungCap");
        return ResponseEntity.ok(nhaCungCapService.getAllNhaCungCap());
    }

    // 2. LẤY CHI TIẾT
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<NhaCungCap> getById(@PathVariable Integer id) {
        log.info("REST request to get NhaCungCap details, ID: {}", id);
        return ResponseEntity.ok(nhaCungCapService.getNhaCungCapById(id));
    }

    // 3. THÊM MỚI
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_CREATE')")
    public ResponseEntity<?> create(@RequestBody NhaCungCapRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to CREATE NhaCungCap: {}, by User: {}", request.getTenNCC(), username);

        // Bỏ try-catch
        return ResponseEntity.ok(nhaCungCapService.createNhaCungCap(request, username));
    }

    // 4. CẬP NHẬT
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody NhaCungCapRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to UPDATE NhaCungCap ID: {}, by User: {}", id, username);

        return ResponseEntity.ok(nhaCungCapService.updateNhaCungCap(id, request, username));
    }

    // 5. XÓA (SOFT DELETE)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        String username = authentication.getName();
        log.info("REST request to DELETE (Soft) NhaCungCap ID: {}, by User: {}", id, username);

        nhaCungCapService.deleteNhaCungCap(id, username);
        return ResponseEntity.ok("Đã xóa nhà cung cấp thành công.");
    }

    // 6. TÌM KIẾM
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<List<NhaCungCap>> search(@RequestParam String query) {
        log.info("REST request to SEARCH NhaCungCap with keyword: {}", query);
        return ResponseEntity.ok(nhaCungCapService.search(query));
    }

    // 7. XEM THÙNG RÁC
    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_DELETE')") // Bảo mật: Chỉ người có quyền xóa mới xem được rác
    public ResponseEntity<List<NhaCungCap>> getTrash() {
        log.info("REST request to get TRASH NhaCungCap list");
        return ResponseEntity.ok(nhaCungCapService.getTrash());
    }

    // 8. KHÔI PHỤC
    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_DELETE')") // Bảo mật: Quyền xóa kiêm quyền khôi phục
    public ResponseEntity<String> restore(@PathVariable int id) {
        log.info("REST request to RESTORE NhaCungCap ID: {}", id);
        nhaCungCapService.restoreNhaCungCap(id);
        return ResponseEntity.ok("Khôi phục nhà cung cấp thành công!");
    }
}