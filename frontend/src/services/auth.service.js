// src/services/auth.service.js
import axios from "axios";

const API_AUTH_URL = "http://localhost:8080/api/auth";
// [!] Sửa lại URL theo yêu cầu của bạn
const API_COMMON_URL = "http://localhost:8080/api/common";

/**
 * API Đăng nhập (Lấy token)
 */
export const loginAPI = (username, password) => {
  return axios.post(`${API_AUTH_URL}/login`, {
    tenDangNhap: username,
    matKhau: password,
  });
};

/**
 * [MỚI & SỬA LẠI] API Lấy thông tin User (bằng token)
 */
export const getUserInfoAPI = (token) => {
  // [!] Sử dụng API mới mà bạn cung cấp
  return axios.get(`${API_COMMON_URL}/user-info`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
};
