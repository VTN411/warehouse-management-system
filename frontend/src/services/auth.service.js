// src/services/auth.service.js

import api from "./api"; // Import client API đã cấu hình
import { setToken, removeToken, getToken } from "../utils/token";

/**
 * API Đăng nhập
 * Lưu ý: API này không dùng token, nên nó đặc biệt
 */
export const loginAPI = (username, password) => {
  // Chúng ta không dùng 'api' (vì 'api' tự gắn token)
  // Chúng ta dùng axios.create() tạm thời hoặc gọi thẳng
  // Ở đây tôi sẽ dùng lại cách cũ của bạn cho đơn giản
  return api.post(
    "/auth/login", // Giả sử baseURL là '.../api'
    {
      tenDangNhap: username,
      matKhau: password,
    },
    {
      // [!] Yêu cầu 'api' KHÔNG gửi token
      headers: { Authorization: "" },
    }
  );
};

/**
 * API Lấy thông tin User (dùng token tự động)
 */
export const getUserInfoAPI = () => {
  // api.js sẽ tự động lấy token và gắn vào header
  return api.get("/common/user-info");
};

// --- Các hàm tiện ích ---
export const saveAuthData = (token) => {
  setToken(token);
};

export const clearAuthData = () => {
  removeToken();
};

export const isLoggedIn = () => {
  return !!getToken();
};