// src/services/user.service.js

import api from './api'; // Import client API đã cấu hình

// Đường dẫn API (vì baseURL đã là '.../api')
const API_ENDPOINT = '/admin/users';

// 1. Lấy tất cả người dùng (GET /api/admin/users)
export const getAllUsers = () => {
  return api.get(API_ENDPOINT);
};

// 2. Tạo người dùng mới (POST /api/admin/users)
export const createUser = (userData) => {
  return api.post(API_ENDPOINT, userData);
};

// 3. Cập nhật người dùng (PUT /api/admin/users/:id)
export const updateUser = (userId, updateData) => {
  return api.put(`${API_ENDPOINT}/${userId}`, updateData);
};

// 4. Xóa người dùng (DELETE /api/admin/users/:id)
export const deleteUser = (userId) => {
  return api.delete(`${API_ENDPOINT}/${userId}`);
};