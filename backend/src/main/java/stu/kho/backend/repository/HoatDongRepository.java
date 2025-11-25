package stu.kho.backend.repository;

import stu.kho.backend.dto.HoatDongResponse;
import stu.kho.backend.entity.HoatDong;

import java.util.List;

public interface HoatDongRepository {
    int save(HoatDong hoatDong);
    List<HoatDongResponse> findAllLogs();
}