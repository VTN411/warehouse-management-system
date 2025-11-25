// src/services/log.service.js

import api from "./api";

const API_ENDPOINT = "/admin/logs";

// Lấy toàn bộ nhật ký
export const getAllLogs = () => {
  return api.get(API_ENDPOINT);
};