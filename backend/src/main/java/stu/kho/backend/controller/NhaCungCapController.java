package stu.kho.backend.controller;

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

public class NhaCungCapController {

    private final NhaCungCapService nhaCungCapService;

    public NhaCungCapController(NhaCungCapService nhaCungCapService) {
        this.nhaCungCapService = nhaCungCapService;
    }

    // 1. LẤY DANH SÁCH
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<List<NhaCungCap>> getAll() {
        return ResponseEntity.ok(nhaCungCapService.getAllNhaCungCap());
    }

    // 2. LẤY CHI TIẾT
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<NhaCungCap> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(nhaCungCapService.getNhaCungCapById(id));
    }

    // 3. THÊM MỚI
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_CREATE')")
    public ResponseEntity<?> create(@RequestBody NhaCungCapRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(nhaCungCapService.createNhaCungCap(request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. CẬP NHẬT
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody NhaCungCapRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(nhaCungCapService.updateNhaCungCap(id, request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. XÓA
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        try {
            nhaCungCapService.deleteNhaCungCap(id, authentication.getName());
            return ResponseEntity.ok("Đã xóa nhà cung cấp thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_SUPPLIER_VIEW')")
    public ResponseEntity<List<NhaCungCap>> search(@RequestParam String query) {
        return ResponseEntity.ok(nhaCungCapService.search(query));
    }
    @GetMapping("/trash")
    public ResponseEntity<List<NhaCungCap>> getTrash() {
        return ResponseEntity.ok(nhaCungCapService.getTrash());
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<String> restore(@PathVariable int id) {
        nhaCungCapService.restoreNhaCungCap(id);
        return ResponseEntity.ok("Khôi phục nhà cung cấp thành công!");
    }
}