// src/services/report.service.js

import api from "./api";

// 1. Báo cáo Tồn kho (kèm cảnh báo)
// Giả định API: GET /api/baocao/tonkho
export const getInventoryReport = () => {
  return api.get("/baocao/tonkho");
};

export const getHistoryReport = () => {
  return api.get("/baocao/lichsu");
};

export const getNXTReport = (params) => {
  return api.get("/baocao/nxt-chitiet", { params });
};