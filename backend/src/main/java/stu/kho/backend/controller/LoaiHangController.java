package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.LoaiHangRequest;
import stu.kho.backend.entity.LoaiHang;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.service.LoaiHangService;

import java.util.List;

@RestController
@RequestMapping("/api/loaihang")
@CrossOrigin(origins = "*")
public class LoaiHangController {

    private final LoaiHangService loaiHangService;

    public LoaiHangController(LoaiHangService loaiHangService) {
        this.loaiHangService = loaiHangService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<List<LoaiHang>> getAll() {
        return ResponseEntity.ok(loaiHangService.getAllLoaiHang());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<LoaiHang> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(loaiHangService.getLoaiHangById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATEGORY_CREATE')")
    public ResponseEntity<?> create(@RequestBody LoaiHangRequest request, Authentication auth) {
        return ResponseEntity.ok(loaiHangService.createLoaiHang(request, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_EDIT')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody LoaiHangRequest request, Authentication auth) {
        return ResponseEntity.ok(loaiHangService.updateLoaiHang(id, request, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_DELETE')")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication auth) {
        loaiHangService.deleteLoaiHang(id, auth.getName());
        return ResponseEntity.ok("Đã xóa loại hàng thành công.");
    }
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_CATEGORY_VIEW')")
    public ResponseEntity<List<LoaiHang>> search(@RequestParam String query) {
        return ResponseEntity.ok(loaiHangService.search(query));
    }
    @GetMapping("/trash")
    public ResponseEntity<List<LoaiHang>> getTrash() {
        return ResponseEntity.ok(loaiHangService.getTrash());
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<String> restore(@PathVariable int id) {
        loaiHangService.restoreLoaiHang(id);
        return ResponseEntity.ok("Khôi phục loại hàng thành công!");
    }
}