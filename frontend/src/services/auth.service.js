// src/services/auth.service.js
import axios from 'axios';

// Cập nhật URL chính xác theo Postman của bạn
const API_URL = 'http://localhost:8080/api/auth';

export const loginAPI = (username, password) => {
  return axios.post(`${API_URL}/login`, {
    // Ánh xạ dữ liệu từ Form (username/password) sang Backend (tenDangNhap/matKhau)
    tenDangNhap: username,
    matKhau: password
  });
};