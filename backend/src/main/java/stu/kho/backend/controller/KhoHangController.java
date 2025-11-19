package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.KhoHangRequest;
import stu.kho.backend.entity.KhoHang;
import stu.kho.backend.service.KhoHangService;

import java.util.List;

@RestController
@RequestMapping("/api/kho")
public class KhoHangController {

    private final KhoHangService khoHangService;

    public KhoHangController(KhoHangService khoHangService) {
        this.khoHangService = khoHangService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<List<KhoHang>> getAll() {
        return ResponseEntity.ok(khoHangService.getAllKhoHang());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_VIEW')")
    public ResponseEntity<KhoHang> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(khoHangService.getKhoHangById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_KHO_CREATE')")
    public ResponseEntity<?> create(@RequestBody KhoHangRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(khoHangService.createKhoHang(request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody KhoHangRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(khoHangService.updateKhoHang(id, request, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_KHO_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        try {
            khoHangService.deleteKhoHang(id, authentication.getName());
            return ResponseEntity.ok("Đã xóa kho hàng thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}