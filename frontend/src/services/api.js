// src/services/api.js

import axios from 'axios';
import { getToken } from '../utils/token'; // Import hàm lấy token của bạn

// Địa chỉ backend của bạn
const BASE_URL = 'http://localhost:8080/api';

// Tạo một "instance" axios với cấu hình riêng
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cấu hình "interceptor" để TỰ ĐỘNG thêm token vào MỌI request
api.interceptors.request.use(
  (config) => {
    const token = getToken(); // Lấy token từ localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Trả về config đã sửa
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;