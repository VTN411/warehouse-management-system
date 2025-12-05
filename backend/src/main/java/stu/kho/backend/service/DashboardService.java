package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import stu.kho.backend.dto.*;
import stu.kho.backend.repository.JdbcDashboardRepository;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class DashboardService {

    private final JdbcDashboardRepository dashboardRepository;

    public DashboardService(JdbcDashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public DashboardStatsDTO getStats(LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        if (to == null) to = LocalDate.now();
        return dashboardRepository.getStats(from, to);
    }

    public List<ChartDataDTO> getChart(Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return dashboardRepository.getChartData(year);
    }

    public List<TopProductDTO> getTopProducts(String type, Integer limit, LocalDate from, LocalDate to) {
        if (limit == null) limit = 5;
        if (from == null) from = LocalDate.now().with(TemporalAdjusters.firstDayOfYear());
        if (to == null) to = LocalDate.now();
        return dashboardRepository.getTopProducts(type, limit, from, to);
    }

    public DashboardAlertsDTO getAlerts() {
        return dashboardRepository.getAlerts();
    }

    public List<BaoCaoNxtDTO> getNxtReport(LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        if (to == null) to = LocalDate.now();
        return dashboardRepository.getBaoCaoNXT(from, to);
    }
}