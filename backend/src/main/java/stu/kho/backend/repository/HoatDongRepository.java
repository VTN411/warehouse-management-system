package stu.kho.backend.repository;

import stu.kho.backend.entity.HoatDong;

public interface HoatDongRepository {
    // Định nghĩa phương thức để lưu log
    int save(HoatDong hoatDong);
}