// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../utils/token';

const PrivateRoute = () => {
  const isAuth = !!getToken(); // Kiểm tra xem có token hay không

  // Nếu đã đăng nhập (có token), cho phép truy cập (Outlet)
  // Nếu chưa, điều hướng về trang /login
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;