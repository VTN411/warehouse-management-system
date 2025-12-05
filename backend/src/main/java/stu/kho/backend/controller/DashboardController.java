package stu.kho.backend.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import stu.kho.backend.dto.*;
import stu.kho.backend.service.DashboardService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // 1. Tổng quan (Stats)
    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAuthority('PERM_DASHBOARD_VIEW')")
    public ResponseEntity<DashboardStatsDTO> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getStats(from, to));
    }

    // 2. Biểu đồ (Chart)
    @GetMapping("/dashboard/chart")
    @PreAuthorize("hasAuthority('PERM_DASHBOARD_VIEW')")
    public ResponseEntity<List<ChartDataDTO>> getChart(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(dashboardService.getChart(year));
    }

    // 3. Top Sản phẩm
    @GetMapping("/dashboard/top-products")
    @PreAuthorize("hasAuthority('PERM_DASHBOARD_VIEW')")
    public ResponseEntity<List<TopProductDTO>> getTopProducts(
            @RequestParam(defaultValue = "export") String type,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getTopProducts(type, limit, from, to));
    }

    // 4. Cảnh báo (Alerts)
    @GetMapping("/dashboard/alerts")
    @PreAuthorize("hasAuthority('PERM_DASHBOARD_VIEW')")
    public ResponseEntity<DashboardAlertsDTO> getAlerts() {
        return ResponseEntity.ok(dashboardService.getAlerts());
    }

    // 5. Báo cáo NXT Chi tiết
    @GetMapping("/baocao/nxt-chitiet")
    @PreAuthorize("hasAuthority('PERM_REPORT_NXT_VIEW')")
    public ResponseEntity<List<BaoCaoNxtDTO>> getNxtReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getNxtReport(from, to));
    }
}