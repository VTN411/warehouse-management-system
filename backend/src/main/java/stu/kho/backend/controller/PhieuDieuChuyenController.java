package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.PhieuDieuChuyenRequest;
import stu.kho.backend.entity.PhieuDieuChuyen;
import stu.kho.backend.service.PhieuDieuChuyenService;

import java.util.List;

@RestController
@RequestMapping("/api/dieuchuyen")
@CrossOrigin(origins = "*")
public class PhieuDieuChuyenController {

    private final PhieuDieuChuyenService service;

    public PhieuDieuChuyenController(PhieuDieuChuyenService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_TRANSFER_CREATE')")
    public ResponseEntity<?> create(@RequestBody PhieuDieuChuyenRequest req, Authentication auth) {
        try {
            return ResponseEntity.ok(service.create(req, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_TRANSFER_APPROVE')")
    public ResponseEntity<?> approve(@PathVariable Integer id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.approve(id, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_TRANSFER_CANCEL')")
    public ResponseEntity<?> cancel(@PathVariable Integer id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.cancel(id, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TRANSFER_VIEW')")
    public ResponseEntity<List<PhieuDieuChuyen>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TRANSFER_VIEW')")
    public ResponseEntity<PhieuDieuChuyen> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TRANSFER_CREATE')") // Người tạo thường có quyền sửa
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestBody PhieuDieuChuyenRequest req,
                                    Authentication auth) {
        try {
            return ResponseEntity.ok(service.update(id, req, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TRANSFER_CANCEL')") // Người có quyền Hủy thường có quyền Xóa
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication auth) {
        try {
            service.delete(id, auth.getName());
            return ResponseEntity.ok("Xóa phiếu điều chuyển thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}