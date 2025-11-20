// src/services/warehouse.service.js

import api from "./api";

// Dựa trên ảnh Postman của bạn
const API_ENDPOINT = "/kho"; 

// 1. Lấy danh sách kho
export const getAllWarehouses = () => {
  return api.get(API_ENDPOINT);
};

// 2. Tạo kho mới
export const createWarehouse = (data) => {
  return api.post(API_ENDPOINT, data);
};

// 3. Cập nhật kho
export const updateWarehouse = (id, data) => {
  return api.put(`${API_ENDPOINT}/${id}`, data);
};

// 4. Xóa kho
export const deleteWarehouse = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};