package stu.kho.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.BaoCaoTonKhoDTO;
import stu.kho.backend.repository.JdbcBaoCaoRepository;

import java.util.List;

@RestController
@RequestMapping("/api/baocao")
@CrossOrigin(origins = "*")
public class BaoCaoController {

    private final JdbcBaoCaoRepository baoCaoRepository;

    // Inject trực tiếp Repository (Vì báo cáo đơn giản không cần qua Service)
    public BaoCaoController(JdbcBaoCaoRepository baoCaoRepository) {
        this.baoCaoRepository = baoCaoRepository;
    }

    // API: Xem tồn kho
    @GetMapping("/tonkho")
    @PreAuthorize("hasAuthority('PERM_REPORT_INVENTORY')")
    public ResponseEntity<List<BaoCaoTonKhoDTO>> getTonKho() {
        return ResponseEntity.ok(baoCaoRepository.getBaoCaoTonKho());
    }
}