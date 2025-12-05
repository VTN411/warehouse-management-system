package stu.kho.backend.repository;

import stu.kho.backend.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface DashboardRepository {
    List<ChartDataDTO> getChartData(int year);
    DashboardStatsDTO getStats(LocalDate from, LocalDate to);
    List<TopProductDTO> getTopProducts(String type, int limit, LocalDate from, LocalDate to);
    DashboardAlertsDTO getAlerts ();
    List<BaoCaoNxtDTO> getBaoCaoNXT(LocalDate from, LocalDate to);

    }