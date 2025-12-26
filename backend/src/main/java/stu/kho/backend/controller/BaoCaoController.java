package stu.kho.backend.controller;

import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.BaoCaoNxtDTO;
import stu.kho.backend.dto.BaoCaoTonKhoDTO;
import stu.kho.backend.dto.LichSuGiaoDichDTO;
import stu.kho.backend.repository.JdbcBaoCaoRepository;
import stu.kho.backend.repository.JdbcDashboardRepository;
import stu.kho.backend.service.ExcelExportService;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/baocao")
@CrossOrigin(origins = "*")
public class BaoCaoController {

    private final JdbcBaoCaoRepository baoCaoRepository;
    private final JdbcDashboardRepository dashboardRepository;
    private final ExcelExportService excelExportService;
    // Inject trực tiếp Repository (Vì báo cáo đơn giản không cần qua Service)
    public BaoCaoController(JdbcBaoCaoRepository baoCaoRepository, JdbcDashboardRepository dashboardRepository, ExcelExportService excelExportService) {
        this.baoCaoRepository = baoCaoRepository;
        this.dashboardRepository = dashboardRepository;
        this.excelExportService = excelExportService;
    }

    // API: Xem tồn kho
    @GetMapping("/tonkho")
    @PreAuthorize("hasAuthority('PERM_REPORT_INVENTORY')")
    public ResponseEntity<List<BaoCaoTonKhoDTO>> getTonKho() {
        return ResponseEntity.ok(baoCaoRepository.getBaoCaoTonKho());
    }
    @GetMapping("/lichsu")
    @PreAuthorize("hasAuthority('PERM_REPORT_HISTORY')")
    public ResponseEntity<List<LichSuGiaoDichDTO>> getLichSuGiaoDich() {
        // Gọi phương thức mới trong Repository
        return ResponseEntity.ok(baoCaoRepository.getLichSuGiaoDich());
    }
    @GetMapping("/export/nxt")
    public ResponseEntity<InputStreamResource> exportNxt(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        // 1. Lấy dữ liệu từ Database (Tái sử dụng hàm cũ của bạn)
        List<BaoCaoNxtDTO> data = dashboardRepository.getBaoCaoNXT(from, to);

        // 2. Tạo file Excel
        ByteArrayInputStream in = excelExportService.exportBaoCaoNXT(data, from, to);

        // 3. Trả về file cho trình duyệt download
        String fileName = "BaoCao_NXT_" + from + "_den_" + to + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}
