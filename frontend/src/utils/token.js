// src/utils/token.js

export const getToken = () => {
  // [!] LUÔN ĐỌC TRỰC TIẾP TỪ LOCAL STORAGE
  return localStorage.getItem('access_token');
};

export const setToken = (token) => {
  localStorage.setItem('access_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('access_token');
};