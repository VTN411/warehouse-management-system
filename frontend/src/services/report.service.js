// src/services/report.service.js

import api from "./api";

// 1. Báo cáo Tồn kho (kèm cảnh báo)
// Giả định API: GET /api/baocao/tonkho
export const getInventoryReport = () => {
  return api.get("/baocao/tonkho");
};

// 2. Báo cáo Lịch sử Nhập/Xuất
// Giả định API: GET /api/baocao/lichsu
export const getHistoryReport = () => {
  return api.get("/baocao/lichsu");
};