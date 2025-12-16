// src/services/customer.service.js

import api from "./api";

const API_ENDPOINT = "/khachhang";

// 1. Lấy danh sách khách hàng
export const getAllCustomers = () => {
  return api.get(API_ENDPOINT);
};

// 2. Tạo khách hàng mới
export const createCustomer = (data) => {
  return api.post(API_ENDPOINT, data);
};

// 3. Cập nhật khách hàng
export const updateCustomer = (id, data) => {
  return api.put(`${API_ENDPOINT}/${id}`, data);
};

// 4. Xóa khách hàng
export const deleteCustomer = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};

export const searchCustomers = (keyword) => {
  return api.get(`${API_ENDPOINT}/search`, {
    params: { query: keyword } // API này tìm được cả Tên và SĐT
  });
};
export const getTrashCustomers = () => {
  return api.get(`${API_ENDPOINT}/trash`);
};

// 2. Khôi phục khách hàng
export const restoreCustomer = (id) => {
  return api.put(`${API_ENDPOINT}/${id}/restore`);
};