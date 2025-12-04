// src/services/api.js

import axios from 'axios';
import { Modal } from 'antd';
import { getToken, removeToken } from '../utils/token';

const BASE_URL = 'https://quanlykho-backend.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

let isSessionExpiredMessageShown = false;

const handleSessionExpired = () => {
  if (isSessionExpiredMessageShown) return;
  isSessionExpiredMessageShown = true;

  // Debug: In ra console để biết hàm này đã được gọi
  console.log("--- PHÁT HIỆN HẾT HẠN TOKEN ---");

  removeToken();
  localStorage.removeItem("user_info");

  Modal.warning({
    title: 'Phiên đăng nhập hết hạn',
    content: 'Tài khoản của bạn đã hết hạn. Vui lòng đăng nhập lại.',
    okText: 'Đăng nhập lại',
    centered: true,
    keyboard: false,
    maskClosable: false,
    onOk: () => {
      isSessionExpiredMessageShown = false;
      window.location.href = '/login';
    },
  });
};

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    if (config.url.includes('/auth/login')) {
      return config;
    }

    const token = getToken();
    
    // Debug: Xem token hiện tại là gì
    console.log("Check Token trước khi gửi:", token);

    if (!token) {
       handleSessionExpired();
       // Hủy request
       const controller = new AbortController();
       config.signal = controller.signal;
       controller.abort(); 
       return Promise.reject(new Error("No token found")); 
    }

    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Kiểm tra lỗi 401, 403 hoặc Lỗi mạng (CORS)
    if (
      (error.response && (error.response.status === 401 || error.response.status === 403)) ||
      error.code === "ERR_NETWORK" || 
      !error.response
    ) {
       // Nếu gặp lỗi mạng, kiểm tra lại token lần nữa
       // Nếu token không còn (do vừa bị xóa), gọi thông báo ngay
       if (!getToken()) {
           handleSessionExpired();
       }
    }
    return Promise.reject(error);
  }
);

export default api;