// src/services/supplier.service.js

import api from "./api";

const API_ENDPOINT = "/nhacungcap";

// 1. Lấy danh sách nhà cung cấp
export const getAllSuppliers = () => {
  return api.get(API_ENDPOINT);
};

// 2. Tạo nhà cung cấp mới
export const createSupplier = (data) => {
  return api.post(API_ENDPOINT, data);
};

// 3. Cập nhật nhà cung cấp
export const updateSupplier = (id, data) => {
  return api.put(`${API_ENDPOINT}/${id}`, data);
};

// 4. Xóa nhà cung cấp
export const deleteSupplier = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};

export const searchSuppliers = (keyword) => {
  return api.get(`${API_ENDPOINT}/search`, {
    params: {
      query: keyword 
    }
  });
};

export const getTrashSuppliers = () => {
  return api.get(`${API_ENDPOINT}/trash`);
};


export const restoreSupplier = (id) => {
  return api.put(`${API_ENDPOINT}/${id}/restore`);
};